import {
  Controller,
  Get,
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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_EXAMPLE = {
  id: 'inv_a1b2c3d4e5f6',
  title: 'Summer Wedding 2025',
  status: 'draft',
  slug: null,
  canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff', backgroundImage: null },
  elements: [],
  ownerId: null,
  createdAt: '2025-04-14T10:00:00.000Z',
  updatedAt: '2025-04-14T10:00:00.000Z',
};

const PUBLISHED_PROJECT_EXAMPLE = {
  ...PROJECT_EXAMPLE,
  status: 'published',
  slug: 'summer-wedding-2025-a3f9c2',
};

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a blank invitation project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'Project created with an empty canvas and no elements.',
    schema: { example: PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  @ApiResponse({
    status: 200,
    description: 'Array of projects ordered by last updated, newest first.',
    schema: { example: [PROJECT_EXAMPLE] },
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by ID (includes all elements)' })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project found. Elements are sorted by zIndex on the frontend.',
    schema: { example: PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update project title, canvas settings, or full element array',
    description:
      'All fields are optional. When `elements` is provided, all existing elements are deleted ' +
      'and replaced atomically in a single DB transaction — this is the primary auto-save path.',
  })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully.',
    schema: { example: PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and all its elements' })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID' })
  @ApiResponse({ status: 204, description: 'Project deleted. Elements cascade-deleted.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish a project',
    description:
      'Sets status to "published" and generates a stable public slug if one does not already exist. ' +
      'Republishing reuses the existing slug.',
  })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Project published. The public viewer URL is /view/{slug}.',
    schema: { example: PUBLISHED_PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  publish(@Param('id') id: string) {
    return this.projectsService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a project (revert to draft)' })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Project reverted to draft. The public slug is retained but the page returns 404 until republished.',
    schema: { example: PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  unpublish(@Param('id') id: string) {
    return this.projectsService.unpublish(id);
  }
}
