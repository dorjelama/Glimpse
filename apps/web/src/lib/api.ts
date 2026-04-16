const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Projects
  createProject: (body: { title?: string; canvas?: Record<string, any> }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),

  listProjects: () => request<Project[]>('/projects'),

  getProject: (id: string) => request<Project>(`/projects/${id}`),

  updateProject: (id: string, body: { title?: string; canvas?: { width?: number; height?: number }; pages?: Page[]; pageTransition?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Publish
  publishProject: (id: string) =>
    request<{ project: Project; publicUrl: string }>(`/publish/${id}`, { method: 'POST' }),

  unpublishProject: (id: string) =>
    request<Project>(`/publish/${id}`, { method: 'DELETE' }),

  getPublished: (slug: string) =>
    request<Project>(`/publish/view/${slug}`),

  // Guests
  listGuests: (projectId: string) =>
    request<Guest[]>(`/projects/${projectId}/guests`),

  addGuest: (projectId: string, body: { name: string; email?: string }) =>
    request<Guest>(`/projects/${projectId}/guests`, { method: 'POST', body: JSON.stringify(body) }),

  deleteGuest: (projectId: string, guestId: string) =>
    request<void>(`/projects/${projectId}/guests/${guestId}`, { method: 'DELETE' }),

  resolveGuest: (token: string) =>
    request<{ name: string; projectId: string }>(`/guests/token/${token}`),

  // Image upload (multipart — handled separately)
  uploadImage: async (projectId: string, file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/projects/${projectId}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

// Shared types (mirrors backend entities)

/** Shared canvas dimensions for all pages in a project. */
export interface CanvasSettings {
  width: number;
  height: number;
}

export type ElementType = 'text' | 'image' | 'shape' | 'button' | 'divider' | 'guestname' | 'countdown';

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
  elements: CanvasElement[];
}

export interface Guest {
  id: string;
  projectId: string;
  name: string;
  email?: string;
  token: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  status: 'draft' | 'published';
  slug?: string;
  canvas: CanvasSettings;
  pages: Page[];
  pageTransition: string;
  createdAt: string;
  updatedAt: string;
}
