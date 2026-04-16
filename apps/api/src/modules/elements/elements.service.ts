import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseElement } from '../events/entities/event.entity';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

// ─── Mapper ──────────────────────────────────────────────────────────────────

type PrismaElement = Prisma.ElementGetPayload<Record<string, never>>;

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

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ElementsService {
  constructor(private readonly prisma: PrismaService) {}

  async addElement(eventId: string, dto: CreateElementDto): Promise<BaseElement> {
    // Resolve the first page of this event (or a specific pageId from the DTO)
    const pageId: string | undefined = (dto as any).pageId;
    let resolvedPageId: string;

    if (pageId) {
      resolvedPageId = pageId;
    } else {
      const firstPage = await this.prisma.page.findFirst({
        where: { eventId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      if (!firstPage) throw new NotFoundException(`Event ${eventId} not found`);
      resolvedPageId = firstPage.id;
    }

    // Resolve max zIndex for this page's elements
    const agg = await this.prisma.element.aggregate({
      where: { pageId: resolvedPageId },
      _max: { zIndex: true },
    });
    const maxZ = agg._max.zIndex ?? 0;

    const element = await this.prisma.element.create({
      data: {
        id: uuidv4(),
        pageId: resolvedPageId,
        type: dto.type as any,
        x: dto.x,
        y: dto.y,
        width: dto.width,
        height: dto.height,
        zIndex: dto.zIndex ?? maxZ + 1,
        styles: dto.styles ?? {},
        content: dto.content ?? null,
        src: dto.src ?? null,
        alt: dto.alt ?? null,
      },
    });
    return toElement(element);
  }

  async updateElement(
    eventId: string,
    elementId: string,
    dto: UpdateElementDto,
  ): Promise<BaseElement> {
    // Verify element belongs to this event (via page)
    const existing = await this.prisma.element.findFirst({
      where: { id: elementId, page: { eventId } },
    });
    if (!existing) throw new NotFoundException(`Element ${elementId} not found`);

    const data: Prisma.ElementUpdateInput = {};
    if (dto.x !== undefined) data.x = dto.x;
    if (dto.y !== undefined) data.y = dto.y;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.zIndex !== undefined) data.zIndex = dto.zIndex;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.src !== undefined) data.src = dto.src;
    if (dto.alt !== undefined) data.alt = dto.alt;
    if (dto.styles !== undefined) {
      // Merge with existing styles rather than replace
      data.styles = { ...(existing.styles as object), ...dto.styles };
    }

    const updated = await this.prisma.element.update({
      where: { id: elementId },
      data,
    });
    return toElement(updated);
  }

  async removeElement(eventId: string, elementId: string): Promise<void> {
    const existing = await this.prisma.element.findFirst({
      where: { id: elementId, page: { eventId } },
    });
    if (!existing) throw new NotFoundException(`Element ${elementId} not found`);
    await this.prisma.element.delete({ where: { id: elementId } });
  }

  async reorderElement(
    eventId: string,
    elementId: string,
    direction: 'up' | 'down' | 'top' | 'bottom',
  ): Promise<BaseElement[]> {
    const el = await this.prisma.element.findFirst({
      where: { id: elementId, page: { eventId } },
    });
    if (!el) throw new NotFoundException(`Element ${elementId} not found`);

    const agg = await this.prisma.element.aggregate({
      where: { pageId: el.pageId },
      _max: { zIndex: true },
      _min: { zIndex: true },
    });
    const maxZ = agg._max.zIndex ?? el.zIndex;
    const minZ = agg._min.zIndex ?? el.zIndex;

    let newZ = el.zIndex;
    switch (direction) {
      case 'up':    newZ = Math.min(el.zIndex + 1, maxZ + 1); break;
      case 'down':  newZ = Math.max(el.zIndex - 1, 1);        break;
      case 'top':   newZ = maxZ + 1;                           break;
      case 'bottom': newZ = Math.max(minZ - 1, 1);            break;
    }

    await this.prisma.element.update({
      where: { id: elementId },
      data: { zIndex: newZ },
    });

    const all = await this.prisma.element.findMany({ where: { pageId: el.pageId } });
    return all.map(toElement);
  }
}
