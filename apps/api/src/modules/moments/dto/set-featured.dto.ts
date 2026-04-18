import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetFeaturedDto {
  @ApiProperty({ example: 'photo_abc123' })
  @IsString()
  photoId: string;
}
