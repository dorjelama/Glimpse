import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login(credentials: { email: string; password: string }): Promise<void>;
  register(credentials: { name: string; email: string; password: string }): Promise<void>;
  logout(): void;
  updateUser(dto: { name?: string; currentPassword?: string; newPassword?: string }): Promise<AuthUser>;
  deleteAccount(): Promise<void>;
}

function setTokenCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `glimpse-token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function clearTokenCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'glimpse-token=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      async login({ email, password }) {
        const res = await fetch(`${BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Invalid email or password');
        }
        const { token, user } = await res.json();
        set({ token, user });
        setTokenCookie(token);
      },

      async register({ name, email, password }) {
        const res = await fetch(`${BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Registration failed');
        }
        const { token, user } = await res.json();
        set({ token, user });
        setTokenCookie(token);
      },

      logout() {
        set({ user: null, token: null });
        clearTokenCookie();
      },

      async updateUser(dto) {
        const { token } = get();
        const res = await fetch(`${BASE}/auth/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(dto),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Update failed');
        }
        const updated: AuthUser = await res.json();
        set((s) => ({ user: s.user ? { ...s.user, ...updated } : updated }));
        return updated;
      },

      async deleteAccount() {
        const { token } = get();
        const res = await fetch(`${BASE}/auth/me`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok && res.status !== 204) {
          throw new Error('Account deletion failed');
        }
        set({ user: null, token: null });
        clearTokenCookie();
      },
    }),
    {
      name: 'glimpse-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
