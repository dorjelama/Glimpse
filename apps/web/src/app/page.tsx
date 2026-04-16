'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type GlimpseEvent } from '@/lib/api';
import UserMenu from '@/components/UserMenu';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function EventCard({
  event,
  onDelete,
}: {
  event: GlimpseEvent;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteEvent(event.id);
      onDelete(event.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/editor/${event.id}`)}
      className="group relative bg-panel border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200"
    >
      {/* Canvas colour / background image preview (from first page) */}
      <div
        className="h-40 flex items-center justify-center border-b border-white/10 overflow-hidden"
        style={{ backgroundColor: event.pages[0]?.backgroundColor || '#f3f4f6' }}
      >
        {event.pages[0]?.backgroundImage ? (
          <img
            src={event.pages[0].backgroundImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-10 select-none">✉</span>
        )}
      </div>

      {/* Info row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <p className="text-white font-medium text-sm truncate">{event.title}</p>
          <span
            className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              event.status === 'published'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-gray-400'
            }`}
          >
            {event.status}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">Edited {timeAgo(event.updatedAt)}</p>
      </div>

      {/* Hover actions */}
      <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {event.status === 'published' && event.slug && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/view/${event.slug}`, '_blank');
            }}
            className="text-[11px] px-2.5 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg transition-colors"
          >
            View
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/editor/${event.id}`);
          }}
          className="text-[11px] px-2.5 py-1 bg-accent/20 hover:bg-accent/40 text-purple-300 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setConfirmDelete(false)}
          className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
            confirmDelete
              ? 'bg-red-500/60 text-white'
              : 'bg-white/10 hover:bg-red-500/30 text-gray-400 hover:text-red-300'
          }`}
        >
          {deleting ? '…' : confirmDelete ? 'Sure?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<GlimpseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const list = await api.listEvents();
      setEvents(
        [...list].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const event = await api.createEvent({ title: 'Untitled Invitation' });
      router.push(`/editor/${event.id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Glimpse</h1>
          <p className="text-xs text-purple-300/70 mt-0.5">Invitation Builder</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            <span className="text-base leading-none">+</span>
            {creating ? 'Creating…' : 'New Invitation'}
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Could not load events: {error}
          </div>
        )}

        {/* Section label */}
        {!loading && events.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Your Invitations
            </h2>
            <span className="text-xs text-gray-600">{events.length} total</span>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6 opacity-20 select-none">✉</div>
            <p className="text-white font-semibold text-lg mb-2">No invitations yet</p>
            <p className="text-gray-500 text-sm mb-8">
              Create your first invitation and share it with the world.
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium rounded-xl transition-colors"
            >
              {creating ? 'Creating…' : '+ Create New Invitation'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
