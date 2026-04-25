import { Controller, Get, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness check — confirms the process is running' })
  @ApiResponse({ status: 200, schema: { example: { status: 'ok', timestamp: '2026-04-25T10:00:00.000Z' } } })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check — confirms database connectivity' })
  @ApiResponse({ status: 200, schema: { example: { status: 'ready' } } })
  @ApiResponse({ status: 503, schema: { example: { status: 'unavailable', error: 'Database unreachable' } } })
  async ready(@Res() res: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({ status: 'ready' });
    } catch (err: any) {
      return res.status(503).json({ status: 'unavailable', error: 'Database unreachable' });
    }
  }
}
