import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PricingService, PricingDto } from './pricing.service';

@Controller('admin/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  get() {
    return this.pricingService.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Body() dto: PricingDto) {
    return this.pricingService.update(dto);
  }
}
