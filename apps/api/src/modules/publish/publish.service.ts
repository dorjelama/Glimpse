import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class PublishService {
  constructor(private readonly projectsService: ProjectsService) {}

  async publishProject(id: string): Promise<{ project: Project; publicUrl: string }> {
    const project = await this.projectsService.publish(id);
    const publicUrl = `/view/${project.slug}`;
    return { project, publicUrl };
  }

  async unpublishProject(id: string): Promise<Project> {
    return this.projectsService.unpublish(id);
  }

  async getPublishedBySlug(slug: string): Promise<Project> {
    return this.projectsService.findBySlug(slug);
  }
}
