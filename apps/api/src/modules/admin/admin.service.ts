import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalUsers, totalProjects, totalEvents, publishedEvents, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: 'published' } }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    return {
      totalUsers,
      totalProjects,
      totalEvents,
      publishedEvents,
      draftEvents: totalEvents - publishedEvents,
      recentUsers,
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { events: true } },
      },
    });
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.prisma.user.delete({ where: { id } });
  }

  async setUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, createdAt: true, _count: { select: { events: true } } },
    });
  }

  async getEvents() {
    return this.prisma.event.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { name: true, email: true } },
      },
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    await this.prisma.event.delete({ where: { id } });
  }
}
