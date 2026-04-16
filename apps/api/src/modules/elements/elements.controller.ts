import {
  Controller,
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ElementsService } from './elements.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

const ELEMENT_EXAMPLE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  eventId: 'evt_a1b2c3d4e5f6',
  type: 'text',
  x: 100, y: 200, width: 320, height: 60, zIndex: 1,
  styles: { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', textAlign: 'center' },
  content: 'You are cordially invited!',
  src: null,
  alt: null,
};

@ApiTags('Elements')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/elements')
export class ElementsController {
  constructor(
    private readonly elementsService: ElementsService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkOwnership(eventId: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });
    if (!event) throw new ForbiddenException();
    if (event.ownerId && event.ownerId !== userId) throw new ForbiddenException();
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new element to an event',
    description: 'zIndex auto-increments above the current maximum when not provided.',
  })
  @ApiParam({ name: 'eventId', example: 'evt_a1b2c3d4e5f6', description: 'Parent event ID' })
  @ApiBody({ type: CreateElementDto })
  @ApiResponse({
    status: 201,
    description: 'Element created and added to the event.',
    schema: { example: ELEMENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async addElement(
    @Param('eventId') eventId: string,
    @Body() dto: CreateElementDto,
    @Req() req: any,
  ) {
    await this.checkOwnership(eventId, req.user.userId);
    return this.elementsService.addElement(eventId, dto);
  }

  @Patch(':elementId')
  @ApiOperation({
    summary: 'Update element properties',
    description:
      'All fields optional. `styles` are merged (patch semantics) — only provided style keys are overwritten.',
  })
  @ApiParam({ name: 'eventId', example: 'evt_a1b2c3d4e5f6', description: 'Parent event ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiBody({ type: UpdateElementDto })
  @ApiResponse({
    status: 200,
    description: 'Element updated.',
    schema: { example: { ...ELEMENT_EXAMPLE, x: 150, styles: { fontSize: '24px', color: '#7c3aed' } } },
  })
  @ApiResponse({ status: 404, description: 'Element not found in this event.' })
  async updateElement(
    @Param('eventId') eventId: string,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateElementDto,
    @Req() req: any,
  ) {
    await this.checkOwnership(eventId, req.user.userId);
    return this.elementsService.updateElement(eventId, elementId, dto);
  }

  @Delete(':elementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an element from an event' })
  @ApiParam({ name: 'eventId', example: 'evt_a1b2c3d4e5f6', description: 'Parent event ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Element deleted.' })
  @ApiResponse({ status: 404, description: 'Element not found in this event.' })
  async removeElement(
    @Param('eventId') eventId: string,
    @Param('elementId') elementId: string,
    @Req() req: any,
  ) {
    await this.checkOwnership(eventId, req.user.userId);
    return this.elementsService.removeElement(eventId, elementId);
  }

  @Post(':elementId/reorder/:direction')
  @ApiOperation({
    summary: 'Change element z-order',
    description:
      '`up` / `down` moves one step; `top` / `bottom` jumps to the highest or lowest z-index in the event. ' +
      'Returns the updated full element list for the event.',
  })
  @ApiParam({ name: 'eventId', example: 'evt_a1b2c3d4e5f6', description: 'Parent event ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiParam({
    name: 'direction',
    enum: ['up', 'down', 'top', 'bottom'],
    example: 'up',
    description: 'Direction to shift the element in the z-order stack.',
  })
  @ApiResponse({
    status: 201,
    description: 'Z-index updated. Returns all elements for the event.',
    schema: { example: [ELEMENT_EXAMPLE] },
  })
  @ApiResponse({ status: 404, description: 'Element not found in this event.' })
  async reorderElement(
    @Param('eventId') eventId: string,
    @Param('elementId') elementId: string,
    @Param('direction') direction: 'up' | 'down' | 'top' | 'bottom',
    @Req() req: any,
  ) {
    await this.checkOwnership(eventId, req.user.userId);
    return this.elementsService.reorderElement(eventId, elementId, direction);
  }
}
