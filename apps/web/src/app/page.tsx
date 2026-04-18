'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type GlimpseProject } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

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

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: GlimpseProject;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const card = project.events[0];
  const hasGallery = !!project.gallery;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.deleteProject(project.id);
      onDelete(project.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const firstPage = card?.pages?.[0];

  return (
    <div
      onClick={() => router.push(`/events/${project.id}`)}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200"
    >
      {/* Preview thumbnail */}
      <div
        className="h-36 flex items-center justify-center border-b border-white/10 overflow-hidden"
        style={{ backgroundColor: firstPage?.bgColor || '#1e1830' }}
      >
        {firstPage?.bgImage ? (
          <img src={firstPage.bgImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-10 select-none">✦</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-white font-medium text-sm truncate">{project.title}</p>
        {project.date && (
          <p className="text-[11px] text-purple-300/60 mt-0.5">{formatDate(project.date)}</p>
        )}

        {/* Feature chips */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {card && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              card.status === 'published'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-accent/20 text-purple-400'
            }`}>
              Card {card.status === 'published' ? '· Live' : '· Draft'}
            </span>
          )}
          {hasGallery && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400">
              Glimpses
            </span>
          )}
        </div>

        <p className="text-[11px] text-gray-500 mt-2">Edited {timeAgo(project.updatedAt)}</p>
      </div>

      {/* Actions — always visible on touch, hover-only on desktop */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setConfirmDelete(false)}
          className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
            confirmDelete
              ? 'bg-red-500/60 text-white'
              : 'bg-black/40 hover:bg-red-500/30 text-gray-400 hover:text-red-300'
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
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

function WelcomeModal({ onGetStarted, onSkip }: { onGetStarted: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#1e1830] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-6">
        {/* Header */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-3">Glimpse</p>
          <h2 className="text-white font-bold text-xl leading-snug">Create events your guests will remember.</h2>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Two tools, one event — design a beautiful card and capture live Glimpses as they happen.
          </p>
        </div>

        {/* Feature tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-2xl">✦</span>
            <p className="text-white font-semibold text-sm">Cards</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Design an invitation on a drag-and-drop canvas. Publish to a shareable link.
            </p>
          </div>
          <div className="bg-white/5 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-2xl">📸</span>
            <p className="text-white font-semibold text-sm">Moments</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Guests scan a QR code and upload live photos. You curate what shows on the feed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onGetStarted}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Create your first event →
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}

function NewEventModal({ onCreate, onClose }: { onCreate: (title: string, date?: string) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    await onCreate(title.trim(), date || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1e1830] border border-white/10 rounded-2xl shadow-2xl w-[400px] max-w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-semibold text-base mb-1">New Event</h2>
        <p className="text-gray-400 text-sm mb-4">Give your event a name and date. You can change these later.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="e.g. Sarah's Wedding"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-accent placeholder:text-gray-600"
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-accent [color-scheme:dark]"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {creating ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<GlimpseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const list = await api.listProjects();
      const sorted = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(sorted);
      if (sorted.length === 0 && !localStorage.getItem('glimpse-onboarded')) {
        setShowWelcome(true);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const dismissWelcome = () => {
    localStorage.setItem('glimpse-onboarded', '1');
    setShowWelcome(false);
  };

  const handleCreate = async (title: string, date?: string) => {
    const project = await api.createProject({ title, ...(date && { date: new Date(date).toISOString() }) });
    router.push(`/events/${project.id}`);
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <DashboardShell>
      <div className="px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">All your events in one place</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWelcome(true)}
              title="What is Glimpse?"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-bold transition-colors border border-white/10"
            >
              ?
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-accent/20"
            >
              <span className="text-base leading-none">+</span>
              New Event
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Section label */}
        {!loading && projects.length > 0 && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            {projects.length} Event{projects.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-5 opacity-20 select-none">✦</div>
            <p className="text-white font-semibold text-lg mb-2">No events yet</p>
            <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
              Each event gets a Card you design and a Glimpses feed your guests post to live.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors mb-10"
            >
              + New Event
            </button>

            {/* Product preview tiles */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left opacity-50">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-base mb-1">✦</p>
                <p className="text-white text-xs font-semibold mb-1">Card</p>
                <p className="text-gray-500 text-[11px] leading-relaxed">Design an invitation. Publish to a shareable link.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-base mb-1">📸</p>
                <p className="text-white text-xs font-semibold mb-1">Moments</p>
                <p className="text-gray-500 text-[11px] leading-relaxed">Guests upload live photos. You curate the feed.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showWelcome && (
        <WelcomeModal
          onGetStarted={() => { dismissWelcome(); setShowModal(true); }}
          onSkip={dismissWelcome}
        />
      )}

      {showModal && (
        <NewEventModal onCreate={handleCreate} onClose={() => setShowModal(false)} />
      )}
    </DashboardShell>
  );
}
