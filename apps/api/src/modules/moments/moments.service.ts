import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { join, extname } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { FeedEventsService } from './feed-events.service';

const EXPORT_WINDOW_DAYS = 30;

const MAX_PHOTOS = 3;

const SUBMISSION_INCLUDE = {
  photos: { orderBy: { createdAt: 'asc' as const } },
} as const;

@Injectable()
export class MomentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedEvents: FeedEventsService,
  ) {}

  async getGallery(galleryId: string) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { project: { select: { title: true } } },
    });
    if (!gallery) throw new NotFoundException('Gallery not found');
    return gallery;
  }

  async createSubmission(galleryId: string, dto: CreateSubmissionDto) {
    const gallery = await this.getGallery(galleryId);
    if (!gallery.isOpen) throw new ForbiddenException('This gallery is closed');

    return this.prisma.gallerySubmission.create({
      data: { galleryId, guestName: dto.guestName, message: dto.message },
      include: SUBMISSION_INCLUDE,
    });
  }

  async getSubmissionByToken(token: string) {
    const sub = await this.prisma.gallerySubmission.findUnique({
      where: { token },
      include: SUBMISSION_INCLUDE,
    });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }

  async addPhoto(token: string, url: string) {
    const sub = await this.getSubmissionByToken(token);
    if (sub.photos.length >= MAX_PHOTOS) {
      throw new BadRequestException(`Maximum ${MAX_PHOTOS} photos allowed`);
    }

    const photo = await this.prisma.galleryPhoto.create({
      data: { submissionId: sub.id, url },
    });

    // Auto-set the first uploaded photo as featured
    if (!sub.featuredPhotoId) {
      await this.prisma.gallerySubmission.update({
        where: { id: sub.id },
        data: { featuredPhotoId: photo.id },
      });
    }

    return photo;
  }

  async deleteSubmissionByToken(token: string) {
    const sub = await this.getSubmissionByToken(token);
    if (sub.approved) throw new ForbiddenException('Cannot delete an approved submission');
    await this.prisma.gallerySubmission.delete({ where: { id: sub.id } });
    this.feedEvents.publish(sub.galleryId, { type: 'submission.deleted', payload: { id: sub.id } });
  }

  async deletePhoto(token: string, photoId: string) {
    const sub = await this.getSubmissionByToken(token);
    const photo = sub.photos.find((p) => p.id === photoId);
    if (!photo) throw new NotFoundException('Photo not found');

    await this.prisma.galleryPhoto.delete({ where: { id: photoId } });

    if (sub.featuredPhotoId === photoId) {
      const remaining = sub.photos.filter((p) => p.id !== photoId);
      await this.prisma.gallerySubmission.update({
        where: { id: sub.id },
        data: { featuredPhotoId: remaining[0]?.id ?? null },
      });
    }
  }

  async setFeatured(token: string, photoId: string) {
    const sub = await this.getSubmissionByToken(token);
    const photo = sub.photos.find((p) => p.id === photoId);
    if (!photo) throw new NotFoundException('Photo not found in this submission');

    return this.prisma.gallerySubmission.update({
      where: { id: sub.id },
      data: { featuredPhotoId: photoId },
      include: SUBMISSION_INCLUDE,
    });
  }

  async finalise(token: string, message?: string, consent?: boolean) {
    const sub = await this.getSubmissionByToken(token);
    if (sub.photos.length === 0) {
      throw new BadRequestException('Upload at least one photo before submitting');
    }
    if (!consent) {
      throw new BadRequestException('You must consent to photo usage before posting');
    }
    const now = new Date();
    const updated = await this.prisma.gallerySubmission.update({
      where: { id: sub.id },
      data: { message: message?.trim() || null, consentGiven: true, consentAt: now },
      include: SUBMISSION_INCLUDE,
    });
    this.feedEvents.publish(sub.galleryId, { type: 'submission.new', payload: {} });
    return updated;
  }

  async deleteSubmission(galleryId: string, submissionId: string, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    const sub = await this.prisma.gallerySubmission.findUnique({ where: { id: submissionId } });
    if (!sub || sub.galleryId !== galleryId) throw new NotFoundException('Submission not found');
    await this.prisma.gallerySubmission.delete({ where: { id: submissionId } });
    this.feedEvents.publish(galleryId, { type: 'submission.deleted', payload: { id: submissionId } });
  }

  // ── Public live feed ─────────────────────────────────────────────────────

  async getFeed(galleryId: string, sessionId?: string, tokens?: string[], cursor?: string, limit = 20) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { project: { select: { title: true } } },
    });
    if (!gallery) throw new NotFoundException('Gallery not found');

    // Resolve cursor to a timestamp for stable keyset pagination
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorSub = await this.prisma.gallerySubmission.findUnique({
        where: { id: cursor },
        select: { updatedAt: true },
      });
      if (cursorSub) cursorDate = cursorSub.updatedAt;
    }

    // Overfetch by 1 to detect whether a next page exists
    const approved = await this.prisma.gallerySubmission.findMany({
      where: {
        galleryId,
        approved: true,
        ...(cursorDate ? { updatedAt: { lt: cursorDate } } : {}),
      },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
      orderBy: { updatedAt: 'desc' as const },
      take: limit + 1,
    });

    const hasMore = approved.length > limit;
    const page = hasMore ? approved.slice(0, limit) : approved;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    // Own pending submissions only on the first page
    const ownPending = !cursor && tokens && tokens.length > 0
      ? await this.prisma.gallerySubmission.findMany({
          where: { galleryId, approved: false, token: { in: tokens } },
          include: { photos: { orderBy: { createdAt: 'asc' as const } } },
          orderBy: { updatedAt: 'desc' as const },
        })
      : [];

    const allIds = [...ownPending.map(s => s.id), ...page.map(s => s.id)];
    const counts = await this.aggregateCounts(allIds);

    const mineMap = new Map<string, string[]>();
    if (sessionId && allIds.length > 0) {
      const mineRows = await this.prisma.submissionReaction.findMany({
        where: { sessionId, submissionId: { in: allIds } },
        select: { submissionId: true, emoji: true },
      });
      for (const r of mineRows) {
        const list = mineMap.get(r.submissionId) ?? [];
        list.push(r.emoji);
        mineMap.set(r.submissionId, list);
      }
    }

    const combined = [...ownPending, ...page];
    const mapped = combined.map(sub => ({
      ...sub,
      pending: !sub.approved,
      reactionCounts: counts.get(sub.id) ?? {},
      myReactions: mineMap.get(sub.id) ?? [],
    }));

    return { gallery, submissions: mapped, nextCursor };
  }

  private async aggregateCounts(submissionIds: string[]) {
    if (submissionIds.length === 0) return new Map<string, Record<string, number>>();
    const grouped = await this.prisma.submissionReaction.groupBy({
      by: ['submissionId', 'emoji'],
      where: { submissionId: { in: submissionIds } },
      _count: { _all: true },
    });
    const counts = new Map<string, Record<string, number>>();
    for (const g of grouped) {
      const byEmoji = counts.get(g.submissionId) ?? {};
      byEmoji[g.emoji] = g._count._all;
      counts.set(g.submissionId, byEmoji);
    }
    return counts;
  }

  private async aggregateCountsByGallery(galleryId: string) {
    const grouped = await this.prisma.submissionReaction.groupBy({
      by: ['submissionId', 'emoji'],
      where: { submission: { galleryId, approved: true } },
      _count: { _all: true },
    });
    const counts = new Map<string, Record<string, number>>();
    for (const g of grouped) {
      const byEmoji = counts.get(g.submissionId) ?? {};
      byEmoji[g.emoji] = g._count._all;
      counts.set(g.submissionId, byEmoji);
    }
    return counts;
  }

  private async countsForSubmission(submissionId: string): Promise<Record<string, number>> {
    const grouped = await this.prisma.submissionReaction.groupBy({
      by: ['emoji'],
      where: { submissionId },
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const g of grouped) counts[g.emoji] = g._count._all;
    return counts;
  }

  // ── Reactions (public, session-based) ────────────────────────────────────

  async toggleReaction(submissionId: string, sessionId: string, emoji: string) {
    const existing = await this.prisma.submissionReaction.findUnique({
      where: { submissionId_sessionId_emoji: { submissionId, sessionId, emoji } },
    });

    if (existing) {
      await this.prisma.submissionReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.submissionReaction.create({
        data: { submissionId, sessionId, emoji },
      });
    }

    const [reactionCounts, mineRows] = await Promise.all([
      this.countsForSubmission(submissionId),
      this.prisma.submissionReaction.findMany({
        where: { submissionId, sessionId },
        select: { emoji: true },
      }),
    ]);
    const myReactions = mineRows.map(r => r.emoji);

    this.feedEvents.publish(await this.galleryIdForSubmission(submissionId), {
      type: 'reaction.changed',
      payload: { submissionId, reactionCounts },
    });

    return { reactionCounts, myReactions };
  }

  private async galleryIdForSubmission(submissionId: string): Promise<string> {
    const row = await this.prisma.gallerySubmission.findUnique({
      where: { id: submissionId },
      select: { galleryId: true },
    });
    return row?.galleryId ?? '';
  }

  // ── Host moderation ───────────────────────────────────────────────────────

  private async verifyGalleryOwnership(galleryId: string, ownerId: string) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { project: { select: { ownerId: true } } },
    });
    if (!gallery) throw new NotFoundException('Gallery not found');
    if (gallery.project.ownerId !== ownerId) throw new ForbiddenException();
    return gallery;
  }

  async listSubmissions(galleryId: string, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    return this.prisma.gallerySubmission.findMany({
      where: { galleryId },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async setApproved(galleryId: string, submissionId: string, approved: boolean, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    const sub = await this.prisma.gallerySubmission.findUnique({ where: { id: submissionId } });
    if (!sub || sub.galleryId !== galleryId) throw new NotFoundException('Submission not found');
    const updated = await this.prisma.gallerySubmission.update({
      where: { id: submissionId },
      data: { approved },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
    });

    if (approved) {
      const reactionCounts = await this.countsForSubmission(submissionId);
      this.feedEvents.publish(galleryId, {
        type: 'submission.approved',
        payload: { ...updated, reactionCounts, myReactions: [] },
      });
    } else {
      this.feedEvents.publish(galleryId, { type: 'submission.deleted', payload: { id: submissionId } });
    }

    return updated;
  }

  async setGalleryOpen(galleryId: string, isOpen: boolean, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    const updated = await this.prisma.gallery.update({ where: { id: galleryId }, data: { isOpen } });
    this.feedEvents.publish(galleryId, {
      type: 'gallery.updated',
      payload: { isOpen: updated.isOpen, endedAt: updated.endedAt?.toISOString() ?? null },
    });
    return updated;
  }

  async endGallery(galleryId: string, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    const updated = await this.prisma.gallery.update({
      where: { id: galleryId },
      data: { isOpen: false, endedAt: new Date() },
    });
    this.feedEvents.publish(galleryId, {
      type: 'gallery.updated',
      payload: { isOpen: false, endedAt: updated.endedAt!.toISOString() },
    });
    return updated;
  }

  async prepareExport(galleryId: string, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);

    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { project: { select: { title: true } } },
    });

    if (!gallery!.endedAt) {
      throw new BadRequestException('Gallery has not ended yet');
    }

    const cutoff = new Date(gallery!.endedAt);
    cutoff.setDate(cutoff.getDate() + EXPORT_WINDOW_DAYS);
    if (new Date() > cutoff) {
      throw new GoneException('Export window has expired (30 days after event end)');
    }

    const submissions = await this.prisma.gallerySubmission.findMany({
      where: { galleryId, approved: true },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
      orderBy: { createdAt: 'asc' as const },
    });

    const uploadsDir = join(process.cwd(), 'uploads');
    const photoFiles: { filepath: string; archiveName: string }[] = [];

    for (const sub of submissions) {
      const safeName = sub.guestName.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
      for (const photo of sub.photos) {
        const filename = photo.url.replace('/uploads/', '');
        photoFiles.push({
          filepath: join(uploadsDir, filename),
          archiveName: `${safeName}_${photo.id.slice(-6)}${extname(filename)}`,
        });
      }
    }

    const slugTitle = (gallery!.project.title ?? galleryId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    return { filename: `${slugTitle}-moments.zip`, photoFiles, daysRemaining: Math.ceil((cutoff.getTime() - Date.now()) / 86_400_000) };
  }
}
