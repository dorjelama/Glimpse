import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alice Smith' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'currentPassword123' })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'newPassword456', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional()
  newPassword?: string;
}
