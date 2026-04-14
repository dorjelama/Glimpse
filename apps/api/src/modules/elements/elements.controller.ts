import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ElementsService } from './elements.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

const ELEMENT_EXAMPLE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  projectId: 'inv_a1b2c3d4e5f6',
  type: 'text',
  x: 100, y: 200, width: 320, height: 60, zIndex: 1,
  styles: { fontSize: '24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', textAlign: 'center' },
  content: 'You are cordially invited!',
  src: null,
  alt: null,
};

@ApiTags('Elements')
@Controller('projects/:projectId/elements')
export class ElementsController {
  constructor(private readonly elementsService: ElementsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new element to a project',
    description: 'zIndex auto-increments above the current maximum when not provided.',
  })
  @ApiParam({ name: 'projectId', example: 'inv_a1b2c3d4e5f6', description: 'Parent project ID' })
  @ApiBody({ type: CreateElementDto })
  @ApiResponse({
    status: 201,
    description: 'Element created and added to the project.',
    schema: { example: ELEMENT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 400, description: 'Validation error — check type enum and required numeric fields.' })
  addElement(
    @Param('projectId') projectId: string,
    @Body() dto: CreateElementDto,
  ) {
    return this.elementsService.addElement(projectId, dto);
  }

  @Patch(':elementId')
  @ApiOperation({
    summary: 'Update element properties',
    description:
      'All fields optional. `styles` are merged (patch semantics) — only provided style keys are overwritten.',
  })
  @ApiParam({ name: 'projectId', example: 'inv_a1b2c3d4e5f6', description: 'Parent project ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiBody({ type: UpdateElementDto })
  @ApiResponse({
    status: 200,
    description: 'Element updated.',
    schema: { example: { ...ELEMENT_EXAMPLE, x: 150, styles: { fontSize: '24px', color: '#7c3aed' } } },
  })
  @ApiResponse({ status: 404, description: 'Element not found in this project.' })
  updateElement(
    @Param('projectId') projectId: string,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateElementDto,
  ) {
    return this.elementsService.updateElement(projectId, elementId, dto);
  }

  @Delete(':elementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an element from a project' })
  @ApiParam({ name: 'projectId', example: 'inv_a1b2c3d4e5f6', description: 'Parent project ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Element deleted.' })
  @ApiResponse({ status: 404, description: 'Element not found in this project.' })
  removeElement(
    @Param('projectId') projectId: string,
    @Param('elementId') elementId: string,
  ) {
    return this.elementsService.removeElement(projectId, elementId);
  }

  @Post(':elementId/reorder/:direction')
  @ApiOperation({
    summary: 'Change element z-order',
    description:
      '`up` / `down` moves one step; `top` / `bottom` jumps to the highest or lowest z-index in the project. ' +
      'Returns the updated full element list for the project.',
  })
  @ApiParam({ name: 'projectId', example: 'inv_a1b2c3d4e5f6', description: 'Parent project ID' })
  @ApiParam({ name: 'elementId', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Element ID (UUID)' })
  @ApiParam({
    name: 'direction',
    enum: ['up', 'down', 'top', 'bottom'],
    example: 'up',
    description: 'Direction to shift the element in the z-order stack.',
  })
  @ApiResponse({
    status: 201,
    description: 'Z-index updated. Returns all elements for the project.',
    schema: { example: [ELEMENT_EXAMPLE] },
  })
  @ApiResponse({ status: 404, description: 'Element not found in this project.' })
  reorderElement(
    @Param('projectId') projectId: string,
    @Param('elementId') elementId: string,
    @Param('direction') direction: 'up' | 'down' | 'top' | 'bottom',
  ) {
    return this.elementsService.reorderElement(projectId, elementId, direction);
  }
}
