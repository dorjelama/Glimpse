import { useAuthStore } from './authStore';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
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
  // Projects (parent "Event" in UI)
  createProject: (body: { title: string; date?: string }) =>
    request<GlimpseProject>('/projects', { method: 'POST', body: JSON.stringify(body) }),

  listProjects: () => request<GlimpseProject[]>('/projects'),

  getProject: (id: string) => request<GlimpseProject>(`/projects/${id}`),

  updateProject: (id: string, body: { title?: string; date?: string }) =>
    request<GlimpseProject>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  createGallery: (projectId: string) =>
    request<{ id: string; isOpen: boolean }>(`/projects/${projectId}/gallery`, { method: 'POST' }),

  // Events (Cards)
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

  shareCard: (eventId: string, body: { emails: string[]; message?: string; galleryFeedUrl?: string }) =>
    request<{ sent: number }>(`/publish/${eventId}/share`, { method: 'POST', body: JSON.stringify(body) }),

  // Guests
  listGuests: (eventId: string) =>
    request<Guest[]>(`/events/${eventId}/guests`),

  addGuest: (eventId: string, body: { name: string; email?: string }) =>
    request<Guest>(`/events/${eventId}/guests`, { method: 'POST', body: JSON.stringify(body) }),

  updateGuest: (eventId: string, guestId: string, body: { name?: string; email?: string }) =>
    request<Guest>(`/events/${eventId}/guests/${guestId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteGuest: (eventId: string, guestId: string) =>
    request<void>(`/events/${eventId}/guests/${guestId}`, { method: 'DELETE' }),

  resolveGuest: (token: string) =>
    request<{ name: string; eventId: string }>(`/guests/token/${token}`),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  listAdminUsers: () => request<AdminUser[]>('/admin/users'),
  deleteAdminUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  setAdminUserRole: (id: string, role: 'USER' | 'ADMIN') =>
    request<AdminUser>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  listAdminEvents: () => request<AdminEvent[]>('/admin/events'),
  deleteAdminEvent: (id: string) => request<void>(`/admin/events/${id}`, { method: 'DELETE' }),

  // Glimpses / Gallery
  getGallery: (galleryId: string) =>
    request<GalleryInfo>(`/gallery/${galleryId}`),

  createSubmission: (galleryId: string, body: { guestName: string; message?: string }) =>
    request<GallerySubmission>(`/gallery/${galleryId}/submissions`, { method: 'POST', body: JSON.stringify(body) }),

  getSubmission: (token: string) =>
    request<GallerySubmission>(`/gallery/submission/${token}`),

  uploadMomentPhoto: async (token: string, file: File): Promise<GalleryPhoto> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/gallery/submission/${token}/photos`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
    return res.json();
  },

  deleteMomentPhoto: (token: string, photoId: string) =>
    request<void>(`/gallery/submission/${token}/photos/${photoId}`, { method: 'DELETE' }),

  setFeaturedPhoto: (token: string, photoId: string) =>
    request<GallerySubmission>(`/gallery/submission/${token}/featured`, { method: 'PATCH', body: JSON.stringify({ photoId }) }),

  finaliseSubmission: (token: string, message?: string, consent?: boolean) =>
    request<GallerySubmission>(`/gallery/submission/${token}/finalise`, { method: 'POST', body: JSON.stringify({ message, consent }) }),

  toggleReaction: (submissionId: string, sessionId: string, emoji: string) =>
    request<{ reactionCounts: Record<string, number>; myReactions: string[] }>(
      `/gallery/submission/${submissionId}/react`,
      { method: 'POST', body: JSON.stringify({ sessionId, emoji }) },
    ),

  // Host moderation
  listSubmissions: (galleryId: string) =>
    request<GallerySubmission[]>(`/gallery/${galleryId}/manage`),

  getGallerySummary: (galleryId: string) =>
    request<GallerySummary>(`/gallery/${galleryId}/summary`),

  approveSubmission: (galleryId: string, submissionId: string, approved: boolean) =>
    request<GallerySubmission>(`/gallery/${galleryId}/submissions/${submissionId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    }),

  deleteSubmission: (galleryId: string, submissionId: string) =>
    request<void>(`/gallery/${galleryId}/submissions/${submissionId}`, { method: 'DELETE' }),

  setGalleryOpen: (galleryId: string, isOpen: boolean) =>
    request<{ id: string; isOpen: boolean }>(`/gallery/${galleryId}/open`, {
      method: 'PATCH',
      body: JSON.stringify({ isOpen }),
    }),

  endGallery: (galleryId: string) =>
    request<{ id: string; isOpen: boolean; endedAt: string }>(`/gallery/${galleryId}/end`, { method: 'POST' }),

  exportGallery: async (galleryId: string): Promise<void> => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${BASE}/gallery/${galleryId}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => 'Export failed');
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cd = res.headers.get('Content-Disposition');
    a.download = cd?.match(/filename="([^"]+)"/)?.[1] ?? 'glimpses.zip';
    a.click();
    URL.revokeObjectURL(url);
  },

  // Image upload (multipart — handled separately)
  uploadImage: async (eventId: string, file: File): Promise<{ url: string }> => {
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
  backgroundImageOffsetX?: number;
  backgroundImageOffsetY?: number;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { events: number };
}

export interface AdminEvent {
  id: string;
  title: string;
  status: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  owner: { name: string; email: string } | null;
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  recentUsers: { id: string; name: string; email: string; createdAt: string }[];
}

export interface GlimpseEvent {
  id: string;
  title: string;
  status: EventStatus;
  slug?: string;
  canvas: CanvasSettings;
  pages: Page[];
  pageTransition: string;
  galleryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryPhoto {
  id: string;
  submissionId: string;
  url: string;
  createdAt: string;
}

export interface GallerySubmission {
  id: string;
  galleryId: string;
  guestName: string;
  message?: string;
  token: string;
  photos: GalleryPhoto[];
  featuredPhotoId?: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryInfo {
  id: string;
  projectId: string;
  isOpen: boolean;
  endedAt?: string;
  project: { title: string };
}

export interface GallerySummary {
  totalSubmissions: number;
  approvedCount: number;
  uniqueGuests: number;
  topSubmission: {
    id: string;
    guestName: string;
    message?: string;
    featuredPhotoUrl: string | null;
    totalReactions: number;
  } | null;
}

export interface GlimpseProject {
  id: string;
  title: string;
  date?: string;
  events: Array<{
    id: string;
    title: string;
    status: EventStatus;
    slug?: string;
    updatedAt: string;
    pages: Array<{ id: string; bgColor: string; bgImage?: string }>;
  }>;
  gallery: { id: string; isOpen: boolean; endedAt?: string } | null;
  createdAt: string;
  updatedAt: string;
}
