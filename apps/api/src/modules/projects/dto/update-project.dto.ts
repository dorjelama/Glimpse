import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Summer Wedding 2025 — Final',
    description: 'New title for the project.',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Shared canvas dimensions. Only width/height; backgrounds are per-page.',
    type: 'object',
    properties: {
      width:  { type: 'number', example: 1080 },
      height: { type: 'number', example: 1920 },
    },
  })
  @IsObject()
  @IsOptional()
  canvas?: {
    width?: number;
    height?: number;
  };

  @ApiPropertyOptional({
    description:
      'Full pages array. When provided, all existing pages and elements are deleted and ' +
      'replaced atomically (transaction). Each page carries its own elements array.',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id:              { type: 'string', example: 'page_abc123' },
        name:            { type: 'string', example: 'Page 1' },
        order:           { type: 'number', example: 0 },
        bgColor:         { type: 'string', example: '#fdf6e3' },
        bgImage:         { type: 'string', example: 'https://cdn.example.com/bg.jpg', nullable: true },
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:      { type: 'string' },
              type:    { type: 'string', enum: ['text', 'image', 'shape', 'button', 'divider'] },
              x:       { type: 'number' },
              y:       { type: 'number' },
              width:   { type: 'number' },
              height:  { type: 'number' },
              zIndex:  { type: 'number' },
              styles:  { type: 'object' },
              content: { type: 'string' },
              src:     { type: 'string' },
              alt:     { type: 'string' },
            },
          },
        },
      },
    },
  })
  @IsArray()
  @IsOptional()
  pages?: any[];

  @ApiPropertyOptional({
    example: 'slide',
    description: 'Page-change transition for the public viewer. One of: none, fade, slide, flip.',
  })
  @IsString()
  @IsOptional()
  pageTransition?: string;
}
