import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { GlimpseEvent, CanvasSettings, BaseElement, Page } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

// ─── Prisma payload types ────────────────────────────────────────────────────

type PrismaElement = Prisma.ElementGetPayload<Record<string, never>>;
type PrismaPage = Prisma.PageGetPayload<{ include: { elements: true } }>;
type PrismaEvent = Prisma.EventGetPayload<{
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
    backgroundImageRotation: p.bgImageRotation ?? 0,
    backgroundImageScale: p.bgImageScale ?? 1,
    backgroundImageOffsetX: p.bgImageOffsetX ?? 0.5,
    backgroundImageOffsetY: p.bgImageOffsetY ?? 0.5,
    elements: p.elements.map(toElement),
  };
}

function toEvent(e: PrismaEvent): GlimpseEvent {
  const pages = [...e.pages]
    .sort((a, b) => a.order - b.order)
    .map(toPage);

  return {
    id: e.id,
    title: e.title,
    status: e.status as 'draft' | 'published',
    slug: e.slug ?? undefined,
    canvas: {
      width: e.canvasWidth,
      height: e.canvasHeight,
    },
    pages,
    pageTransition: e.pageTransition,
    ownerId: e.ownerId ?? undefined,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// Full include for all reads that need elements
const INCLUDE_PAGES = {
  pages: {
    include: { elements: true },
  },
} satisfies Prisma.EventInclude;

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
      bgImageRotation: true,
      bgImageScale: true,
      bgImageOffsetX: true,
      bgImageOffsetY: true,
    },
  },
} satisfies Prisma.EventInclude;

const DEFAULT_CANVAS: CanvasSettings & { backgroundColor: string } = {
  width: 1080,
  height: 1920,
  backgroundColor: '#ffffff',
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, ownerId?: string, projectId?: string): Promise<GlimpseEvent> {
    const canvas = { ...DEFAULT_CANVAS, ...(dto.canvas ?? {}) };
    const eventId = `evt_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    const event = await this.prisma.$transaction(async (tx) => {
      const e = await tx.event.create({
        data: {
          id: eventId,
          title: dto.title || 'Untitled Card',
          status: 'draft',
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          ownerId: ownerId ?? null,
          projectId: projectId ?? null,
        },
      });

      // Create the default first page, copying any bg settings from the DTO
      await tx.page.create({
        data: {
          id: `page_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
          eventId: e.id,
          name: 'Page 1',
          order: 0,
          bgColor: canvas.backgroundColor,
          bgImage: (dto.canvas as any)?.backgroundImage ?? null,
          bgImageRotation: 0,
          bgImageOffsetX: 0.5,
          bgImageOffsetY: 0.5,
        },
      });

      return tx.event.findUnique({
        where: { id: e.id },
        include: INCLUDE_PAGES,
      });
    });

    return toEvent(event!);
  }

  async findAll(ownerId?: string): Promise<GlimpseEvent[]> {
    const rows = await this.prisma.event.findMany({
      where: ownerId ? { ownerId } : undefined,
      include: INCLUDE_PAGES_LIGHT,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status as 'draft' | 'published',
      slug: e.slug ?? undefined,
      canvas: { width: e.canvasWidth, height: e.canvasHeight },
      pages: (e.pages as any[]).map((pg: any) => ({
        id: pg.id,
        name: pg.name,
        order: pg.order,
        backgroundColor: pg.bgColor,
        backgroundImage: pg.bgImage ?? undefined,
        backgroundImageRotation: (pg as any).bgImageRotation ?? 0,
        backgroundImageScale: (pg as any).bgImageScale ?? 1,
        backgroundImageOffsetX: (pg as any).bgImageOffsetX ?? 0.5,
        backgroundImageOffsetY: (pg as any).bgImageOffsetY ?? 0.5,
        elements: [],
      })),
      pageTransition: e.pageTransition,
      ownerId: e.ownerId ?? undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  async findOne(id: string): Promise<GlimpseEvent> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: INCLUDE_PAGES,
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return toEvent(event);
  }

  async findBySlug(slug: string): Promise<GlimpseEvent> {
    const event = await this.prisma.event.findFirst({
      where: { slug, status: 'published' },
      include: INCLUDE_PAGES,
    });
    if (!event) throw new NotFoundException(`Published invitation not found`);
    return toEvent(event);
  }

  async update(id: string, dto: UpdateEventDto): Promise<GlimpseEvent> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update event-level fields (title, canvas dimensions)
      const eventData: Prisma.EventUpdateInput = {};
      if (dto.title !== undefined) eventData.title = dto.title;
      if (dto.canvas?.width !== undefined) eventData.canvasWidth = dto.canvas.width;
      if (dto.canvas?.height !== undefined) eventData.canvasHeight = dto.canvas.height;
      if (dto.pageTransition !== undefined) eventData.pageTransition = dto.pageTransition;

      if (Object.keys(eventData).length > 0) {
        await tx.event.update({ where: { id }, data: eventData });
      }

      // When pages array is provided: delete all pages (cascade kills elements),
      // then recreate each page + its elements.
      if (dto.pages !== undefined) {
        await tx.page.deleteMany({ where: { eventId: id } });

        for (const pg of dto.pages) {
          const page = await tx.page.create({
            data: {
              id: pg.id ?? uuidv4(),
              eventId: id,
              name: pg.name ?? 'Page',
              order: pg.order ?? 0,
              bgColor: pg.bgColor ?? pg.backgroundColor ?? '#ffffff',
              bgImage: pg.bgImage ?? pg.backgroundImage ?? null,
              bgImageRotation: pg.bgImageRotation ?? pg.backgroundImageRotation ?? 0,
              bgImageScale: pg.bgImageScale ?? pg.backgroundImageScale ?? 1,
              bgImageOffsetX: pg.bgImageOffsetX ?? pg.backgroundImageOffsetX ?? 0.5,
              bgImageOffsetY: pg.bgImageOffsetY ?? pg.backgroundImageOffsetY ?? 0.5,
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

      return tx.event.findUnique({
        where: { id },
        include: INCLUDE_PAGES,
      });
    });

    return toEvent(updated!);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);
    await this.prisma.event.delete({ where: { id } });
  }

  async publish(id: string): Promise<GlimpseEvent> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    const slug = existing.slug ?? this.generateSlug();
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'published', slug },
      include: INCLUDE_PAGES,
    });
    return toEvent(updated);
  }

  async unpublish(id: string): Promise<GlimpseEvent> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'draft' },
      include: INCLUDE_PAGES,
    });
    return toEvent(updated);
  }

  private generateSlug(): string {
    return uuidv4().replace(/-/g, '').slice(0, 16);
  }
}
