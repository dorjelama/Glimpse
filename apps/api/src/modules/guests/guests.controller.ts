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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Guests')
@Controller()
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get('events/:eventId/guests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List guests for an event' })
  list(@Param('eventId') eventId: string, @Req() _req: any) {
    return this.guestsService.list(eventId);
  }

  @Post('events/:eventId/guests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add a guest to an event' })
  create(@Param('eventId') eventId: string, @Body() dto: CreateGuestDto, @Req() _req: any) {
    return this.guestsService.create(eventId, dto);
  }

  @Patch('events/:eventId/guests/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a guest name or email' })
  update(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Body() dto: UpdateGuestDto,
    @Req() _req: any,
  ) {
    return this.guestsService.update(eventId, guestId, dto);
  }

  @Delete('events/:eventId/guests/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a guest' })
  remove(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Req() _req: any,
  ) {
    return this.guestsService.remove(eventId, guestId);
  }

  @Get('guests/token/:token')
  @ApiOperation({ summary: 'Resolve a guest by their unique token (public — no auth required)' })
  resolveByToken(@Param('token') token: string) {
    return this.guestsService.resolveByToken(token);
  }
}
