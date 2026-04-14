import { Controller, Post, Get, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PublishService } from './publish.service';

const PROJECT_EXAMPLE = {
  id: 'inv_a1b2c3d4e5f6',
  title: 'Summer Wedding 2025',
  status: 'published',
  slug: 'summer-wedding-2025-a3f9c2',
  canvas: { width: 1080, height: 1920, backgroundColor: '#ffffff' },
  elements: [],
  createdAt: '2025-04-14T10:00:00.000Z',
  updatedAt: '2025-04-14T11:00:00.000Z',
};

@ApiTags('Publish')
@Controller('publish')
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post(':id')
  @ApiOperation({
    summary: 'Publish a project and generate a shareable public URL',
    description:
      'Saves current state, sets status to "published", and generates a stable slug if the project does not already have one. ' +
      'Returns the updated project and the relative public URL.',
  })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID to publish' })
  @ApiResponse({
    status: 201,
    description: 'Project published. Share the public URL with recipients.',
    schema: {
      example: {
        project: PROJECT_EXAMPLE,
        publicUrl: '/view/summer-wedding-2025-a3f9c2',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  publishProject(@Param('id') id: string) {
    return this.publishService.publishProject(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Unpublish a project (revert to draft)',
    description:
      'Sets status back to "draft". The public slug is preserved so the same URL can be reused on republish. ' +
      'The public viewer returns 404 while the project is in draft status.',
  })
  @ApiParam({ name: 'id', example: 'inv_a1b2c3d4e5f6', description: 'Project ID to unpublish' })
  @ApiResponse({
    status: 200,
    description: 'Project unpublished.',
    schema: { example: { ...PROJECT_EXAMPLE, status: 'draft' } },
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  unpublishProject(@Param('id') id: string) {
    return this.publishService.unpublishProject(id);
  }

  @Get('view/:slug')
  @ApiOperation({
    summary: 'Fetch a published invitation by public slug (no auth required)',
    description:
      'Used by the public viewer page (/view/[slug] in the Next.js app). ' +
      'Returns 404 if the project does not exist or is not in "published" status.',
  })
  @ApiParam({
    name: 'slug',
    example: 'summer-wedding-2025-a3f9c2',
    description: 'The unique public slug generated at publish time',
  })
  @ApiResponse({
    status: 200,
    description: 'Published project found. The full project (with elements) is returned for rendering.',
    schema: { example: PROJECT_EXAMPLE },
  })
  @ApiResponse({ status: 404, description: 'Invitation not found or not published.' })
  getBySlug(@Param('slug') slug: string) {
    return this.publishService.getPublishedBySlug(slug);
  }
}
