import { Controller, Post, Get, Param, Delete, Body, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PublishService } from './publish.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from '../events/events.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

const EVENT_EXAMPLE = {
  id: 'evt_a1b2c3d4e5f6',
  title: 'Summer Wedding 2025',
  status: 'published',
  slug: 'summer-wedding-2025-a3f9c2',
  canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
  elements: [],
  createdAt: '2025-04-14T10:00:00.000Z',
  updatedAt: '2025-04-14T11:00:00.000Z',
};

@ApiTags('Publish')
@Controller('publish')
export class PublishController {
  constructor(
    private readonly publishService: PublishService,
    private readonly eventsService: EventsService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Publish an event and generate a shareable public URL',
    description:
      'Saves current state, sets status to "published", and generates a stable slug if the event does not already have one. ' +
      'Returns the updated event and the relative public URL.',
  })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID to publish' })
  @ApiResponse({
    status: 201,
    description: 'Event published. Share the public URL with recipients.',
    schema: {
      example: {
        event: EVENT_EXAMPLE,
        publicUrl: '/view/summer-wedding-2025-a3f9c2',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async publishEvent(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId && event.ownerId !== req.user.userId) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { emailVerified: true },
    });
    if (user && !user.emailVerified) {
      throw new ForbiddenException('Please verify your email address before publishing.');
    }

    return this.publishService.publishEvent(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Unpublish an event (revert to draft)',
    description:
      'Sets status back to "draft". The public slug is preserved so the same URL can be reused on republish. ' +
      'The public viewer returns 404 while the event is in draft status.',
  })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID to unpublish' })
  @ApiResponse({
    status: 200,
    description: 'Event unpublished.',
    schema: { example: { ...EVENT_EXAMPLE, status: 'draft' } },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async unpublishEvent(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId && event.ownerId !== req.user.userId) throw new ForbiddenException();
    return this.publishService.unpublishEvent(id);
  }

  @Get('view/:slug')
  @ApiOperation({
    summary: 'Fetch a published invitation by public slug (no auth required)',
    description:
      'Used by the public viewer page (/view/[slug] in the Next.js app). ' +
      'Returns 404 if the event does not exist or is not in "published" status.',
  })
  @ApiParam({
    name: 'slug',
    example: 'summer-wedding-2025-a3f9c2',
    description: 'The unique public slug generated at publish time',
  })
  @ApiResponse({
    status: 200,
    description: 'Published event found.',
    schema: { example: EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Invitation not found or not published.' })
  getBySlug(@Param('slug') slug: string) {
    return this.publishService.getPublishedBySlug(slug);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ public: { limit: 10, ttl: 3600000 } }) // 10 sends per hour per IP
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Send card invitation emails via SES (host only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 429, description: 'Too many sends — maximum 10 per hour.' })
  async shareCard(
    @Param('id') id: string,
    @Body('emails') emails: string[],
    @Body('message') message: string | undefined,
    @Body('galleryFeedUrl') galleryFeedUrl: string | undefined,
    @Req() req: any,
  ) {
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new BadRequestException('Provide at least one email address');
    }
    if (emails.length > 50) {
      throw new BadRequestException('Maximum 50 recipients per send');
    }

    const event = await this.eventsService.findOne(id);
    if (event.ownerId && event.ownerId !== req.user.userId) throw new ForbiddenException();
    if (event.status !== 'published' || !event.slug) {
      throw new BadRequestException('Publish the card before sharing it');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const cardUrl = `${frontendUrl}/view/${event.slug}`;

    await this.mailService.sendCardInvitation({
      to: emails,
      eventTitle: event.title,
      cardUrl,
      galleryFeedUrl: galleryFeedUrl || frontendUrl,
      senderName: req.user.name || 'Your host',
      message,
    });

    return { sent: emails.length };
  }
}
