import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';

@ApiTags('Guests')
@Controller()
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get('projects/:projectId/guests')
  @ApiOperation({ summary: 'List guests for a project' })
  list(@Param('projectId') projectId: string) {
    return this.guestsService.list(projectId);
  }

  @Post('projects/:projectId/guests')
  @ApiOperation({ summary: 'Add a guest to a project' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateGuestDto) {
    return this.guestsService.create(projectId, dto);
  }

  @Delete('projects/:projectId/guests/:guestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a guest' })
  remove(@Param('projectId') projectId: string, @Param('guestId') guestId: string) {
    return this.guestsService.remove(projectId, guestId);
  }

  @Get('guests/token/:token')
  @ApiOperation({ summary: 'Resolve a guest by their unique token' })
  resolveByToken(@Param('token') token: string) {
    return this.guestsService.resolveByToken(token);
  }
}
