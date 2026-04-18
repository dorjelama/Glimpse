import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  guestName: string;

  @ApiProperty({ example: 'Wishing you a lifetime of love!', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}
