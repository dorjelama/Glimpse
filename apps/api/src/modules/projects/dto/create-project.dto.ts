import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: "Sarah's Wedding", description: 'Name of the event' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', description: 'Optional event date' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
