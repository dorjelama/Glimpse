import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  token: string;
  createdAt: Date;
}

function toGuest(g: any): Guest {
  return {
    id: g.id,
    eventId: g.eventId,
    name: g.name,
    email: g.email ?? undefined,
    token: g.token,
    createdAt: g.createdAt,
  };
}

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(eventId: string): Promise<Guest[]> {
    const guests = await this.prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
    return guests.map(toGuest);
  }

  async create(eventId: string, dto: CreateGuestDto): Promise<Guest> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const guest = await this.prisma.guest.create({
      data: {
        id: uuidv4(),
        eventId,
        name: dto.name,
        email: dto.email ?? null,
        token: uuidv4(),
      },
    });
    return toGuest(guest);
  }

  async update(eventId: string, guestId: string, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, eventId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email || null }),
      },
    });
    return toGuest(updated);
  }

  async remove(eventId: string, guestId: string): Promise<void> {
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, eventId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);
    await this.prisma.guest.delete({ where: { id: guestId } });
  }

  async resolveByToken(token: string): Promise<{ name: string; eventId: string }> {
    const guest = await this.prisma.guest.findUnique({ where: { token } });
    if (!guest) throw new NotFoundException('Guest not found');
    return { name: guest.name, eventId: guest.eventId };
  }
}
