import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateElementDto {
  @ApiPropertyOptional({ example: 150, description: 'New X position in canvas-space pixels.' })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ example: 250, description: 'New Y position in canvas-space pixels.' })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ example: 400, description: 'New width in pixels.' })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ example: 80, description: 'New height in pixels.' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ example: 5, description: 'New z-order index.' })
  @IsNumber()
  @IsOptional()
  zIndex?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { color: '#7c3aed', fontWeight: '700' },
    description: 'Style properties to merge into the existing styles object (patch semantics).',
  })
  @IsObject()
  @IsOptional()
  styles?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Updated invitation text', description: 'New text content.' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/new.jpg', description: 'New image URL.' })
  @IsString()
  @IsOptional()
  src?: string;

  @ApiPropertyOptional({ example: 'Updated alt text', description: 'New alt text for image.' })
  @IsString()
  @IsOptional()
  alt?: string;
}
