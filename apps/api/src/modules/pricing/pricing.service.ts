import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const SUPPORTED_CURRENCIES = ['USD', 'NPR', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];

export interface PricingDto {
  proMonthly?: number;
  businessMonthly?: number;
  currency?: string;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const existing = await this.prisma.pricingConfig.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.pricingConfig.create({ data: { id: 1 } });
  }

  async update(dto: PricingDto) {
    if (dto.proMonthly !== undefined) {
      if (!Number.isInteger(dto.proMonthly) || dto.proMonthly < 0 || dto.proMonthly > 100000) {
        throw new BadRequestException('proMonthly must be a non-negative integer ≤ 100000');
      }
    }
    if (dto.businessMonthly !== undefined) {
      if (!Number.isInteger(dto.businessMonthly) || dto.businessMonthly < 0 || dto.businessMonthly > 100000) {
        throw new BadRequestException('businessMonthly must be a non-negative integer ≤ 100000');
      }
    }
    if (dto.currency !== undefined) {
      const code = dto.currency.toUpperCase();
      if (!SUPPORTED_CURRENCIES.includes(code)) {
        throw new BadRequestException(`Unsupported currency. Allowed: ${SUPPORTED_CURRENCIES.join(', ')}`);
      }
      dto.currency = code;
    }

    await this.get();
    return this.prisma.pricingConfig.update({
      where: { id: 1 },
      data: dto,
    });
  }
}
