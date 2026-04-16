import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiPropertyOptional({
    example: 'Summer Wedding 2025',
    description: 'Human-readable title for the invitation. Defaults to "Untitled Invitation".',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Initial canvas dimensions. Background is per-page and set on the default "Page 1".',
    type: 'object',
    properties: {
      width:           { type: 'number', example: 1080, description: 'Canvas width in px (default 1080)' },
      height:          { type: 'number', example: 1920, description: 'Canvas height in px (default 1920)' },
      backgroundColor: { type: 'string', example: '#ffffff', description: 'Background color for the first page' },
      backgroundImage: { type: 'string', example: 'https://cdn.example.com/bg.jpg', description: 'Background image URL for the first page (optional)' },
    },
  })
  @IsObject()
  @IsOptional()
  canvas?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    backgroundImage?: string;
  };
}
