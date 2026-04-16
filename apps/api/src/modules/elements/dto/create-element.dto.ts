import { IsString, IsNumber, IsObject, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateElementDto {
  @ApiProperty({
    enum: ['text', 'image', 'shape', 'button', 'divider', 'guestname', 'countdown'],
    example: 'text',
    description: 'Element type — determines which renderer and default styles are applied.',
  })
  @IsIn(['text', 'image', 'shape', 'button', 'divider', 'guestname', 'countdown'])
  type: string;

  @ApiProperty({ example: 100, description: 'X position in canvas-space pixels.' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 200, description: 'Y position in canvas-space pixels.' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 320, description: 'Element width in pixels.' })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 60, description: 'Element height in pixels.' })
  @IsNumber()
  height: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Z-order layer index. Auto-increments above current max when omitted.',
  })
  @IsNumber()
  @IsOptional()
  zIndex?: number;

  @ApiPropertyOptional({
    type: 'object',
    example: { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', textAlign: 'center' },
    description: 'CSS-style properties applied to the element. Merged with type defaults.',
  })
  @IsObject()
  @IsOptional()
  styles?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'You are cordially invited!',
    description: 'Text content for text or button elements.',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/venue.jpg',
    description: 'Image URL for image elements.',
  })
  @IsString()
  @IsOptional()
  src?: string;

  @ApiPropertyOptional({
    example: 'Venue photo',
    description: 'Alt text for image elements.',
  })
  @IsString()
  @IsOptional()
  alt?: string;
}
