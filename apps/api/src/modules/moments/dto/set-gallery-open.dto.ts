import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetGalleryOpenDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isOpen: boolean;
}
