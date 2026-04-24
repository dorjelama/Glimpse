import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type FeedEvent =
  | { type: 'submission.approved'; payload: any }
  | { type: 'submission.deleted'; payload: { id: string } }
  | { type: 'submission.new'; payload: Record<string, never> }
  | { type: 'reaction.changed'; payload: { submissionId: string; reactionCounts: Record<string, number> } }
  | { type: 'gallery.updated'; payload: { isOpen: boolean; endedAt: string | null } };

@Injectable()
export class FeedEventsService {
  private readonly channels = new Map<string, Subject<FeedEvent>>();

  subscribe(galleryId: string): Observable<FeedEvent> {
    return this.channelFor(galleryId).asObservable();
  }

  publish(galleryId: string, event: FeedEvent): void {
    if (!galleryId) return;
    this.channelFor(galleryId).next(event);
  }

  private channelFor(galleryId: string): Subject<FeedEvent> {
    let ch = this.channels.get(galleryId);
    if (!ch) {
      ch = new Subject<FeedEvent>();
      this.channels.set(galleryId, ch);
    }
    return ch;
  }
}
