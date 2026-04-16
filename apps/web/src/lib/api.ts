const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Lazy import to avoid circular dependency — authStore imports nothing from api.ts
  const { useAuthStore } = await import('./authStore');
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Events
  createEvent: (body: { title?: string; canvas?: Record<string, any> }) =>
    request<GlimpseEvent>('/events', { method: 'POST', body: JSON.stringify(body) }),

  listEvents: () => request<GlimpseEvent[]>('/events'),

  getEvent: (id: string) => request<GlimpseEvent>(`/events/${id}`),

  updateEvent: (id: string, body: { title?: string; canvas?: { width?: number; height?: number }; pages?: Page[]; pageTransition?: string }) =>
    request<GlimpseEvent>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, { method: 'DELETE' }),

  // Publish
  publishEvent: (id: string) =>
    request<{ event: GlimpseEvent; publicUrl: string }>(`/publish/${id}`, { method: 'POST' }),

  unpublishEvent: (id: string) =>
    request<GlimpseEvent>(`/publish/${id}`, { method: 'DELETE' }),

  getPublished: (slug: string) =>
    request<GlimpseEvent>(`/publish/view/${slug}`),

  // Guests
  listGuests: (eventId: string) =>
    request<Guest[]>(`/events/${eventId}/guests`),

  addGuest: (eventId: string, body: { name: string; email?: string }) =>
    request<Guest>(`/events/${eventId}/guests`, { method: 'POST', body: JSON.stringify(body) }),

  deleteGuest: (eventId: string, guestId: string) =>
    request<void>(`/events/${eventId}/guests/${guestId}`, { method: 'DELETE' }),

  resolveGuest: (token: string) =>
    request<{ name: string; eventId: string }>(`/guests/token/${token}`),

  // Image upload (multipart — handled separately)
  uploadImage: async (eventId: string, file: File): Promise<{ url: string }> => {
    const { useAuthStore } = await import('./authStore');
    const token = useAuthStore.getState().token;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/events/${eventId}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

// Shared types (mirrors backend entities)

export type EventStatus = 'draft' | 'published';

export type ElementType = 'text' | 'image' | 'shape' | 'button' | 'divider' | 'guestname' | 'countdown';

/** Shared canvas dimensions for all pages in an event. */
export interface CanvasSettings {
  width: number;
  height: number;
}

export interface CanvasElement {
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
  backgroundImageRotation?: number;
  backgroundImageScale?: number;
  elements: CanvasElement[];
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  token: string;
  createdAt: string;
}

export interface GlimpseEvent {
  id: string;
  title: string;
  status: EventStatus;
  slug?: string;
  canvas: CanvasSettings;
  pages: Page[];
  pageTransition: string;
  createdAt: string;
  updatedAt: string;
}
