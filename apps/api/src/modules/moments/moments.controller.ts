import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Req,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, merge, map } from 'rxjs';
import { existsSync, unlink } from 'fs';
import archiver from 'archiver';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { ApiTags, ApiOperation, ApiParam, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MomentsService } from './moments.service';
import { FeedEventsService } from './feed-events.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SetFeaturedDto } from './dto/set-featured.dto';
import { ApproveSubmissionDto } from './dto/approve-submission.dto';
import { SetGalleryOpenDto } from './dto/set-gallery-open.dto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const HEIC_TYPES = new Set(['image/heic', 'image/heif']);

// In-memory token bucket: 30 reactions/min per key. Evicts buckets after 5 min idle.
const REACTION_RATE_MAX = 30;
const REACTION_RATE_WINDOW_MS = 60_000;
const reactionBuckets = new Map<string, { count: number; resetAt: number }>();
function reactionRateLimiter(key: string): boolean {
  const now = Date.now();
  const b = reactionBuckets.get(key);
  if (!b || now >= b.resetAt) {
    reactionBuckets.set(key, { count: 1, resetAt: now + REACTION_RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= REACTION_RATE_MAX) return false;
  b.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of reactionBuckets) {
    if (now >= b.resetAt + REACTION_RATE_WINDOW_MS * 4) reactionBuckets.delete(k);
  }
}, 5 * 60_000).unref?.();

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

@ApiTags('Moments')
@Controller('gallery')
export class MomentsController {
  constructor(
    private readonly momentsService: MomentsService,
    private readonly feedEvents: FeedEventsService,
  ) {}

  @Get(':galleryId')
  @ApiOperation({ summary: 'Get gallery info (public)' })
  @ApiParam({ name: 'galleryId' })
  getGallery(@Param('galleryId') galleryId: string) {
    return this.momentsService.getGallery(galleryId);
  }

  @Post(':galleryId/submissions')
  @ApiOperation({ summary: 'Create a guest submission (public)' })
  @ApiParam({ name: 'galleryId' })
  createSubmission(
    @Param('galleryId') galleryId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.momentsService.createSubmission(galleryId, dto);
  }

  @Get('submission/:token')
  @ApiOperation({ summary: 'Get submission by guest token' })
  getSubmission(@Param('token') token: string) {
    return this.momentsService.getSubmissionByToken(token);
  }

  @Post('submission/:token/photos')
  @ApiOperation({ summary: 'Upload a photo to a submission' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadPhoto(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, or HEIC images are allowed');
    }

    let filename = file.filename;

    if (HEIC_TYPES.has(file.mimetype)) {
      const jpegName = `${uuidv4()}.jpg`;
      const jpegPath = join(process.cwd(), 'uploads', jpegName);
      await sharp(file.path).rotate().jpeg({ quality: 90 }).toFile(jpegPath);
      unlink(file.path, () => {});
      filename = jpegName;
    }

    const url = `/uploads/${filename}`;
    return this.momentsService.addPhoto(token, url);
  }

  @Delete('submission/:token/photos/:photoId')
  @ApiOperation({ summary: 'Remove a photo from a submission' })
  deletePhoto(
    @Param('token') token: string,
    @Param('photoId') photoId: string,
  ) {
    return this.momentsService.deletePhoto(token, photoId);
  }

  @Patch('submission/:token/featured')
  @ApiOperation({ summary: 'Set the featured photo for a submission' })
  setFeatured(@Param('token') token: string, @Body() dto: SetFeaturedDto) {
    return this.momentsService.setFeatured(token, dto.photoId);
  }

  @Post('submission/:token/finalise')
  @ApiOperation({ summary: 'Finalise and submit (validates photos + featured selected)' })
  finalise(@Param('token') token: string, @Body('message') message?: string) {
    return this.momentsService.finalise(token, message);
  }

  @Delete('submission/:token')
  @ApiOperation({ summary: 'Delete own pending submission by guest token (public)' })
  deleteOwnSubmission(@Param('token') token: string) {
    return this.momentsService.deleteSubmissionByToken(token);
  }

  @Get(':galleryId/feed')
  @ApiOperation({ summary: 'Get approved submissions for the live feed (public)' })
  @ApiParam({ name: 'galleryId' })
  getFeed(
    @Param('galleryId') galleryId: string,
    @Query('sessionId') sessionId?: string,
    @Query('tokens') tokens?: string,
  ) {
    const tokenList = tokens ? tokens.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20) : undefined;
    return this.momentsService.getFeed(galleryId, sessionId, tokenList);
  }

  @Sse(':galleryId/feed/stream')
  @ApiOperation({ summary: 'Subscribe to live feed events via Server-Sent Events (public)' })
  @ApiParam({ name: 'galleryId' })
  streamFeed(@Param('galleryId') galleryId: string): Observable<MessageEvent> {
    const events$ = this.feedEvents.subscribe(galleryId).pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );
    const heartbeat$ = interval(25_000).pipe(
      map(() => ({ type: 'ping', data: {} }) as MessageEvent),
    );
    return merge(events$, heartbeat$);
  }

  @Post('submission/:submissionId/react')
  @ApiOperation({ summary: 'Toggle an emoji reaction on a submission (public, session-based)' })
  toggleReaction(
    @Param('submissionId') submissionId: string,
    @Body('sessionId') sessionId: string,
    @Body('emoji') emoji: string,
    @Req() req: any,
  ) {
    if (!sessionId || !emoji) throw new BadRequestException('sessionId and emoji are required');
    const ip = (req.ip ?? req.socket?.remoteAddress ?? 'unknown') as string;
    if (!reactionRateLimiter(`${sessionId}:${ip}`)) {
      throw new BadRequestException('Too many reactions — slow down');
    }
    return this.momentsService.toggleReaction(submissionId, sessionId, emoji);
  }

  // ── Host moderation (JWT-guarded) ────────────────────────────────────────

  @Get(':galleryId/manage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all submissions for a gallery (host only)' })
  @ApiParam({ name: 'galleryId' })
  listSubmissions(@Param('galleryId') galleryId: string, @Req() req: any) {
    return this.momentsService.listSubmissions(galleryId, req.user.userId);
  }

  @Patch(':galleryId/submissions/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Approve or revoke a submission (host only)' })
  @ApiParam({ name: 'galleryId' })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  approveSubmission(
    @Param('galleryId') galleryId: string,
    @Param('id') submissionId: string,
    @Body() dto: ApproveSubmissionDto,
    @Req() req: any,
  ) {
    return this.momentsService.setApproved(galleryId, submissionId, dto.approved, req.user.userId);
  }

  @Delete(':galleryId/submissions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a submission permanently (host only)' })
  @ApiParam({ name: 'galleryId' })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  deleteSubmission(
    @Param('galleryId') galleryId: string,
    @Param('id') submissionId: string,
    @Req() req: any,
  ) {
    return this.momentsService.deleteSubmission(galleryId, submissionId, req.user.userId);
  }

  @Patch(':galleryId/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Open or close gallery for new submissions (host only)' })
  @ApiParam({ name: 'galleryId' })
  setGalleryOpen(
    @Param('galleryId') galleryId: string,
    @Body() dto: SetGalleryOpenDto,
    @Req() req: any,
  ) {
    return this.momentsService.setGalleryOpen(galleryId, dto.isOpen, req.user.userId);
  }

  @Post(':galleryId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'End the event — closes gallery and sets endedAt (host only)' })
  @ApiParam({ name: 'galleryId' })
  endGallery(@Param('galleryId') galleryId: string, @Req() req: any) {
    return this.momentsService.endGallery(galleryId, req.user.userId);
  }

  @Get(':galleryId/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Download ZIP of all approved photos — 30-day window after event ends (host only)' })
  @ApiParam({ name: 'galleryId' })
  async exportGallery(
    @Param('galleryId') galleryId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { filename, photoFiles } = await this.momentsService.prepareExport(galleryId, req.user.userId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', () => res.end());
    archive.pipe(res);

    for (const { filepath, archiveName } of photoFiles) {
      if (existsSync(filepath)) {
        archive.file(filepath, { name: archiveName });
      }
    }

    await archive.finalize();
  }
}
