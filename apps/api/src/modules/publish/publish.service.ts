import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { GlimpseEvent } from '../events/entities/event.entity';

@Injectable()
export class PublishService {
  constructor(private readonly eventsService: EventsService) {}

  async publishEvent(id: string): Promise<{ event: GlimpseEvent; publicUrl: string }> {
    const event = await this.eventsService.publish(id);
    const publicUrl = `/view/${event.slug}`;
    return { event, publicUrl };
  }

  async unpublishEvent(id: string): Promise<GlimpseEvent> {
    return this.eventsService.unpublish(id);
  }

  async getPublishedBySlug(slug: string): Promise<GlimpseEvent> {
    return this.eventsService.findBySlug(slug);
  }
}
