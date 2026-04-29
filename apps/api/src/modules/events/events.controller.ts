import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/svg+xml'];
const HEIC_TYPES = new Set(['image/heic', 'image/heif']);

const EVENT_EXAMPLE = {
  id: 'evt_a1b2c3d4e5f6',
  title: 'Summer Wedding 2025',
  status: 'draft',
  slug: null,
  canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff', backgroundImage: null },
  elements: [],
  ownerId: null,
  createdAt: '2025-04-14T10:00:00.000Z',
  updatedAt: '2025-04-14T10:00:00.000Z',
};

const PUBLISHED_EVENT_EXAMPLE = {
  ...EVENT_EXAMPLE,
  status: 'published',
  slug: 'summer-wedding-2025-a3f9c2',
};

@ApiTags('Events')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a blank invitation event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created with an empty canvas and no elements.',
    schema: { example: EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all events for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Array of events ordered by last updated, newest first.',
    schema: { example: [EVENT_EXAMPLE] },
  })
  findAll(@Req() req: any) {
    return this.eventsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID (includes all elements)' })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event found.',
    schema: { example: EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();
    return event;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update event title, canvas settings, or full page/element array',
    description:
      'All fields are optional. When `pages` is provided, all existing pages are deleted ' +
      'and replaced atomically in a single DB transaction — this is the primary auto-save path.',
  })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully.',
    schema: { example: EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event and all its pages/elements' })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'Event deleted.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();
    return this.eventsService.remove(id);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish an event',
    description:
      'Sets status to "published" and generates a stable public slug if one does not already exist. ' +
      'Republishing reuses the existing slug.',
  })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiResponse({
    status: 201,
    description: 'Event published. The public viewer URL is /view/{slug}.',
    schema: { example: PUBLISHED_EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async publish(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();
    return this.eventsService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish an event (revert to draft)' })
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiResponse({
    status: 201,
    description: 'Event reverted to draft.',
    schema: { example: EVENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async unpublish(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();
    return this.eventsService.unpublish(id);
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload an image for use in the card editor' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', example: 'evt_a1b2c3d4e5f6', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Image uploaded.', schema: { example: { url: 'https://...' } } })
  @ApiResponse({ status: 400, description: 'No file or unsupported type.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<{ url: string }> {
    const event = await this.eventsService.findOne(id);
    if (event.ownerId !== req.user.userId) throw new ForbiddenException();

    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, HEIC, GIF, or SVG images are allowed');
    }

    let buffer = file.buffer;
    let ext = extname(file.originalname).toLowerCase() || '.jpg';
    let contentType = file.mimetype;

    if (HEIC_TYPES.has(file.mimetype)) {
      buffer = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
      ext = '.jpg';
      contentType = 'image/jpeg';
    } else if (file.mimetype !== 'image/svg+xml') {
      try { await sharp(buffer).metadata(); }
      catch { throw new BadRequestException('Invalid or corrupt image file'); }
    }

    const key = `cards/${id}/${uuidv4()}${ext}`;
    const url = await this.storageService.upload(key, buffer, contentType);
    return { url };
  }
}
