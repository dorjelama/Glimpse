import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { Project, CanvasSettings, BaseElement, Page } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

// ─── Prisma payload types ────────────────────────────────────────────────────

type PrismaElement = Prisma.ElementGetPayload<Record<string, never>>;
type PrismaPage = Prisma.PageGetPayload<{ include: { elements: true } }>;
type PrismaProject = Prisma.ProjectGetPayload<{
  include: { pages: { include: { elements: true } } };
}>;

// ─── Mapper helpers ──────────────────────────────────────────────────────────

function toElement(e: PrismaElement): BaseElement {
  return {
    id: e.id,
    type: e.type as BaseElement['type'],
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    zIndex: e.zIndex,
    styles: (e.styles ?? {}) as Record<string, any>,
    content: e.content ?? undefined,
    src: e.src ?? undefined,
    alt: e.alt ?? undefined,
  };
}

function toPage(p: PrismaPage): Page {
  return {
    id: p.id,
    name: p.name,
    order: p.order,
    backgroundColor: p.bgColor,
    backgroundImage: p.bgImage ?? undefined,
    elements: p.elements.map(toElement),
  };
}

function toProject(p: PrismaProject): Project {
  const pages = [...p.pages]
    .sort((a, b) => a.order - b.order)
    .map(toPage);

  return {
    id: p.id,
    title: p.title,
    status: p.status as 'draft' | 'published',
    slug: p.slug ?? undefined,
    canvas: {
      width: p.canvasWidth,
      height: p.canvasHeight,
    },
    pages,
    pageTransition: p.pageTransition,
    ownerId: p.ownerId ?? undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// Full include for all reads that need elements
const INCLUDE_PAGES = {
  pages: {
    include: { elements: true },
  },
} satisfies Prisma.ProjectInclude;

// Lightweight include for list view (only first page bg, no elements)
const INCLUDE_PAGES_LIGHT = {
  pages: {
    take: 1,
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      name: true,
      order: true,
      bgColor: true,
      bgImage: true,
    },
  },
} satisfies Prisma.ProjectInclude;

const DEFAULT_CANVAS: CanvasSettings & { backgroundColor: string } = {
  width: 1080,
  height: 1920,
  backgroundColor: '#ffffff',
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, ownerId?: string): Promise<Project> {
    const canvas = { ...DEFAULT_CANVAS, ...(dto.canvas ?? {}) };
    const projectId = `inv_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    const project = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          id: projectId,
          title: dto.title || 'Untitled Invitation',
          status: 'draft',
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          ownerId: ownerId ?? null,
        },
      });

      // Create the default first page, copying any bg settings from the DTO
      await tx.page.create({
        data: {
          id: `page_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
          projectId: p.id,
          name: 'Page 1',
          order: 0,
          bgColor: canvas.backgroundColor,
          bgImage: (dto.canvas as any)?.backgroundImage ?? null,
        },
      });

      return tx.project.findUnique({
        where: { id: p.id },
        include: INCLUDE_PAGES,
      });
    });

    return toProject(project!);
  }

  async findAll(ownerId?: string): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: ownerId ? { ownerId } : undefined,
      include: INCLUDE_PAGES_LIGHT,
      orderBy: { updatedAt: 'desc' },
    });

    // Map rows with light page data (no elements) — we cast to full type
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status as 'draft' | 'published',
      slug: p.slug ?? undefined,
      canvas: { width: p.canvasWidth, height: p.canvasHeight },
      pages: (p.pages as any[]).map((pg: any) => ({
        id: pg.id,
        name: pg.name,
        order: pg.order,
        backgroundColor: pg.bgColor,
        backgroundImage: pg.bgImage ?? undefined,
        elements: [],
      })),
      pageTransition: p.pageTransition,
      ownerId: p.ownerId ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: INCLUDE_PAGES,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return toProject(project);
  }

  async findBySlug(slug: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { slug, status: 'published' },
      include: INCLUDE_PAGES,
    });
    if (!project) throw new NotFoundException(`Published invitation not found`);
    return toProject(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update project-level fields (title, canvas dimensions)
      const projectData: Prisma.ProjectUpdateInput = {};
      if (dto.title !== undefined) projectData.title = dto.title;
      if (dto.canvas?.width !== undefined) projectData.canvasWidth = dto.canvas.width;
      if (dto.canvas?.height !== undefined) projectData.canvasHeight = dto.canvas.height;
      if (dto.pageTransition !== undefined) projectData.pageTransition = dto.pageTransition;

      if (Object.keys(projectData).length > 0) {
        await tx.project.update({ where: { id }, data: projectData });
      }

      // When pages array is provided: delete all pages (cascade kills elements),
      // then recreate each page + its elements.
      if (dto.pages !== undefined) {
        await tx.page.deleteMany({ where: { projectId: id } });

        for (const pg of dto.pages) {
          const page = await tx.page.create({
            data: {
              id: pg.id ?? uuidv4(),
              projectId: id,
              name: pg.name ?? 'Page',
              order: pg.order ?? 0,
              bgColor: pg.bgColor ?? pg.backgroundColor ?? '#ffffff',
              bgImage: pg.bgImage ?? pg.backgroundImage ?? null,
            },
          });

          const elements: any[] = pg.elements ?? [];
          if (elements.length > 0) {
            await tx.element.createMany({
              data: elements.map((el: any) => ({
                id: el.id ?? uuidv4(),
                pageId: page.id,
                type: el.type,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
                styles: el.styles ?? {},
                content: el.content ?? null,
                src: el.src ?? null,
                alt: el.alt ?? null,
              })),
            });
          }
        }
      }

      return tx.project.findUnique({
        where: { id },
        include: INCLUDE_PAGES,
      });
    });

    return toProject(updated!);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);
    // Pages and elements cascade-delete via FK onDelete: Cascade
    await this.prisma.project.delete({ where: { id } });
  }

  async publish(id: string): Promise<Project> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const slug = existing.slug ?? this.generateSlug(existing.title);
    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: 'published', slug },
      include: INCLUDE_PAGES,
    });
    return toProject(updated);
  }

  async unpublish(id: string): Promise<Project> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status: 'draft' },
      include: INCLUDE_PAGES,
    });
    return toProject(updated);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
    return `${base}-${uuidv4().slice(0, 6)}`;
  }
}
