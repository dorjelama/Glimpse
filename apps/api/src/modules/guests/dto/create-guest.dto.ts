import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestDto {
  @ApiProperty({ example: 'Sarah Johnson' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'sarah@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
