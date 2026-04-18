import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

const MAX_PHOTOS = 3;

const SUBMISSION_INCLUDE = {
  photos: { orderBy: { createdAt: 'asc' as const } },
} as const;

@Injectable()
export class MomentsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async finalise(token: string) {
    const sub = await this.getSubmissionByToken(token);
    if (sub.photos.length === 0) {
      throw new BadRequestException('Upload at least one photo before submitting');
    }
    return sub;
  }

  // ── Public live feed ─────────────────────────────────────────────────────

  async getFeed(galleryId: string) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id: galleryId },
      include: { project: { select: { title: true } } },
    });
    if (!gallery) throw new NotFoundException('Gallery not found');

    const submissions = await this.prisma.gallerySubmission.findMany({
      where: { galleryId, approved: true },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
      orderBy: { updatedAt: 'desc' as const },
    });

    return { gallery, submissions };
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
    return this.prisma.gallerySubmission.update({
      where: { id: submissionId },
      data: { approved },
      include: { photos: { orderBy: { createdAt: 'asc' as const } } },
    });
  }

  async setGalleryOpen(galleryId: string, isOpen: boolean, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    return this.prisma.gallery.update({ where: { id: galleryId }, data: { isOpen } });
  }

  async endGallery(galleryId: string, ownerId: string) {
    await this.verifyGalleryOwnership(galleryId, ownerId);
    return this.prisma.gallery.update({
      where: { id: galleryId },
      data: { isOpen: false, endedAt: new Date() },
    });
  }
}
