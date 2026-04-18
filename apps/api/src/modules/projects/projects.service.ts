import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

function cuid() {
  return 'proj_' + uuidv4().replace(/-/g, '').slice(0, 20);
}

function galleryId() {
  return 'gal_' + uuidv4().replace(/-/g, '').slice(0, 20);
}

const PROJECT_INCLUDE = {
  events: {
    select: {
      id: true,
      title: true,
      status: true,
      slug: true,
      canvasWidth: true,
      canvasHeight: true,
      updatedAt: true,
      pages: {
        take: 1,
        orderBy: { order: 'asc' as const },
        select: { id: true, bgColor: true, bgImage: true },
      },
    },
  },
  gallery: {
    select: { id: true, isOpen: true },
  },
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateProjectDto, ownerId: string) {
    const projectId = cuid();

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          id: projectId,
          title: dto.title,
          date: dto.date ? new Date(dto.date) : null,
          ownerId,
        },
      });
      return p;
    });

    // Auto-create a Card (Event) for this project
    const card = await this.eventsService.create(
      { title: dto.title },
      ownerId,
      projectId,
    );

    return this.findOne(projectId, ownerId);
  }

  async findAll(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      include: PROJECT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (project.ownerId !== ownerId) throw new ForbiddenException();
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, ownerId: string) {
    await this.findOne(id, ownerId); // ownership check
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.date !== undefined && { date: dto.date ? new Date(dto.date) : null }),
      },
      include: PROJECT_INCLUDE,
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId); // ownership check
    await this.prisma.project.delete({ where: { id } });
  }

  async createGallery(id: string, ownerId: string) {
    await this.findOne(id, ownerId); // ownership check
    const existing = await this.prisma.gallery.findUnique({ where: { projectId: id } });
    if (existing) return existing;

    return this.prisma.gallery.create({
      data: { id: galleryId(), projectId: id },
    });
  }
}
