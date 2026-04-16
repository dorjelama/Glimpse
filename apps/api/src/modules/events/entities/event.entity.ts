export type EventStatus = 'draft' | 'published';

export type ElementType = 'text' | 'image' | 'shape' | 'button' | 'divider' | 'guestname' | 'countdown';

/** Shared canvas dimensions for all pages in an event. */
export interface CanvasSettings {
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  styles: Record<string, any>;
  content?: string;
  src?: string;
  alt?: string;
}

export interface Page {
  id: string;
  name: string;
  order: number;
  backgroundColor: string;
  backgroundImage?: string;
  elements: BaseElement[];
}

export interface GlimpseEvent {
  id: string;
  title: string;
  status: EventStatus;
  slug?: string;
  canvas: CanvasSettings;
  pages: Page[];
  pageTransition: string;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
