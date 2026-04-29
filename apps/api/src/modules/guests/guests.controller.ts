import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Guests')
@Controller()
export class GuestsController {
  constructor(
    private readonly guestsService: GuestsService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkEventOwnership(eventId: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });
    if (!event || event.ownerId !== userId) throw new ForbiddenException();
  }

  @Get('events/:eventId/guests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List guests for an event' })
  async list(@Param('eventId') eventId: string, @Req() req: any) {
    await this.checkEventOwnership(eventId, req.user.userId);
    return this.guestsService.list(eventId);
  }

  @Post('events/:eventId/guests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add a guest to an event' })
  async create(@Param('eventId') eventId: string, @Body() dto: CreateGuestDto, @Req() req: any) {
    await this.checkEventOwnership(eventId, req.user.userId);
    return this.guestsService.create(eventId, dto);
  }

  @Patch('events/:eventId/guests/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a guest name or email' })
  async update(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Body() dto: UpdateGuestDto,
    @Req() req: any,
  ) {
    await this.checkEventOwnership(eventId, req.user.userId);
    return this.guestsService.update(eventId, guestId, dto);
  }

  @Delete('events/:eventId/guests/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a guest' })
  async remove(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Req() req: any,
  ) {
    await this.checkEventOwnership(eventId, req.user.userId);
    return this.guestsService.remove(eventId, guestId);
  }

  @Get('guests/token/:token')
  @UseGuards(ThrottlerGuard)
  @Throttle({ public: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Resolve a guest by their unique token (public — no auth required)' })
  resolveByToken(@Param('token') token: string) {
    return this.guestsService.resolveByToken(token);
  }
}
