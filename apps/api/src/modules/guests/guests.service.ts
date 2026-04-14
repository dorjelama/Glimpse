import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';

export interface Guest {
  id: string;
  projectId: string;
  name: string;
  email?: string;
  token: string;
  createdAt: Date;
}

function toGuest(g: any): Guest {
  return {
    id: g.id,
    projectId: g.projectId,
    name: g.name,
    email: g.email ?? undefined,
    token: g.token,
    createdAt: g.createdAt,
  };
}

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string): Promise<Guest[]> {
    const guests = await this.prisma.guest.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    return guests.map(toGuest);
  }

  async create(projectId: string, dto: CreateGuestDto): Promise<Guest> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const guest = await this.prisma.guest.create({
      data: {
        id: uuidv4(),
        projectId,
        name: dto.name,
        email: dto.email ?? null,
        token: uuidv4(),
      },
    });
    return toGuest(guest);
  }

  async remove(projectId: string, guestId: string): Promise<void> {
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, projectId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);
    await this.prisma.guest.delete({ where: { id: guestId } });
  }

  async resolveByToken(token: string): Promise<{ name: string; projectId: string }> {
    const guest = await this.prisma.guest.findUnique({ where: { token } });
    if (!guest) throw new NotFoundException('Guest not found');
    return { name: guest.name, projectId: guest.projectId };
  }
}
