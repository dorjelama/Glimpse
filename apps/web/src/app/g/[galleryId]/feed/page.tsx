'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const POLL_MS = 10_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedPhoto {
  id: string;
  url: string;
}

interface FeedSubmission {
  id: string;
  guestName: string;
  message?: string;
  featuredPhotoId?: string;
  photos: FeedPhoto[];
  updatedAt: string;
}

interface FeedData {
  gallery: { id: string; isOpen: boolean; endedAt?: string; project: { title: string } };
  submissions: FeedSubmission[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const WARM_PALETTES = [
  '#b5763a', '#a0622e', '#8b5523', '#c98b44', '#7a4f26',
  '#c4783d', '#9b6830', '#d4924a', '#8a5828', '#b06832',
];
function avatarBg(name: string) {
  return WARM_PALETTES[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % WARM_PALETTES.length];
}

// ── Post card ────────────────────────────────────────────────────────────────

function PostCard({ sub, fresh }: { sub: FeedSubmission; fresh: boolean }) {
  const featured = sub.photos.find(p => p.id === sub.featuredPhotoId) ?? sub.photos[0];
  const rest = sub.photos.filter(p => p.id !== featured?.id);

  return (
    <article
      className={`rounded-2xl overflow-hidden shadow-md transition-all duration-700 ${
        fresh
          ? 'ring-2 ring-amber-400/70 shadow-amber-200/40'
          : 'ring-0'
      }`}
      style={{ backgroundColor: '#fffdf7', border: '1px solid #e8d9bd' }}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none"
          style={{ backgroundColor: avatarBg(sub.guestName) }}
        >
          {initials(sub.guestName)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate" style={{ color: '#2d1a00' }}>
            {sub.guestName}
          </p>
        </div>
        {fresh && (
          <span className="ml-auto text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            New
          </span>
        )}
      </div>

      {/* Message */}
      {sub.message && (
        <p className="px-4 pb-3 text-sm leading-relaxed" style={{ color: '#5c3d1e' }}>
          {sub.message}
        </p>
      )}

      {/* Featured photo */}
      {featured && (
        <div style={{ backgroundColor: '#f5ebe0' }}>
          <img
            src={photoUrl(featured.url)}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: '420px', filter: 'sepia(10%) contrast(0.97) brightness(1.01)' }}
          />
        </div>
      )}

      {/* Additional photos strip */}
      {rest.length > 0 && (
        <div className="flex gap-px" style={{ backgroundColor: '#e8d9bd' }}>
          {rest.map(p => (
            <div key={p.id} className="flex-1 overflow-hidden" style={{ height: '88px' }}>
              <img
                src={photoUrl(p.url)}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'sepia(10%) contrast(0.97)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer stamp */}
      <div className="px-4 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid #f0e0c8' }}>
        <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#c8a878' }}>
          Glimpse · Glimpses
        </span>
      </div>
    </article>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4 opacity-40">📷</div>
      <p className="font-semibold text-sm" style={{ color: '#8a6840' }}>No Glimpses yet</p>
      <p className="text-xs mt-1" style={{ color: '#b09070' }}>
        Approved photos will appear here as guests upload them.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FeedPage({ params }: { params: { galleryId: string } }) {
  const [data, setData] = useState<FeedData | null>(null);
  const [submissions, setSubmissions] = useState<FeedSubmission[]>([]);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/gallery/${params.galleryId}/feed`);
      if (!res.ok) { setError(true); return; }
      const json: FeedData = await res.json();

      setData(json);
      const incoming = json.submissions;

      if (firstLoad.current) {
        incoming.forEach(s => seenRef.current.add(s.id));
        setSubmissions(incoming);
        firstLoad.current = false;
      } else {
        const newOnes = incoming.filter(s => !seenRef.current.has(s.id));
        if (newOnes.length > 0) {
          newOnes.forEach(s => seenRef.current.add(s.id));
          setSubmissions(incoming);
          const ids = new Set(newOnes.map(s => s.id));
          setFreshIds(prev => new Set([...prev, ...ids]));
          setTimeout(() => {
            setFreshIds(prev => {
              const next = new Set(prev);
              ids.forEach(id => next.delete(id));
              return next;
            });
          }, 6_000);
        }
      }
    } catch {
      if (firstLoad.current) setError(true);
    } finally {
      setLoading(false);
    }
  }, [params.galleryId]);

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, POLL_MS);
    return () => clearInterval(id);
  }, [fetchFeed]);

  // ── Shell ──────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fdf6e8 0%, #faebd7 50%, #f5e6cc 100%)',
  };

  if (loading) {
    return (
      <div style={pageStyle} className="flex items-center justify-center">
        <p className="text-sm animate-pulse" style={{ color: '#b09070' }}>Loading Glimpses…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={pageStyle} className="flex items-center justify-center">
        <p className="text-sm" style={{ color: '#b07050' }}>Gallery not found.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e1206', borderBottom: '2px solid #3d2810' }} className="sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate" style={{ color: '#f5d99a' }}>
              {data.gallery.project.title}
            </p>
            <p className="text-[11px]" style={{ color: '#a08050' }}>Glimpses · Live feed</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: data.gallery.isOpen ? '#22c55e' : '#6b7280' }}
              />
              <span className="text-[11px] font-medium" style={{ color: data.gallery.isOpen ? '#86efac' : '#9ca3af' }}>
                {data.gallery.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <button
              onClick={async () => { setRefreshing(true); await fetchFeed(); setRefreshing(false); }}
              disabled={refreshing}
              title="Refresh feed"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#3d2810', color: '#f5d99a' }}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={refreshing ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Post-event banner */}
      {data.gallery.endedAt && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div
            className="rounded-xl px-4 py-3 text-center text-[12px]"
            style={{ backgroundColor: '#f5ebe0', border: '1px solid #e8d9bd', color: '#8a6840' }}
          >
            This event has ended · {new Date(data.gallery.endedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · Thank you for sharing your Glimpses
          </div>
        </div>
      )}

      {/* Share CTA — only when gallery is open */}
      {data.gallery.isOpen && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <a
            href={`/g/${params.galleryId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1e1206', color: '#f5d99a', border: '1px solid #3d2810' }}
          >
            <span>📸</span>
            Share your moment
          </a>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {submissions.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="flex flex-col">
            {submissions.map((sub, i) => (
              <div key={sub.id} className="flex gap-3">
                {/* Spine + dot */}
                <div className="flex flex-col items-center flex-shrink-0 w-5">
                  <div
                    className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-[14px]"
                    style={{ borderColor: freshIds.has(sub.id) ? '#f59e0b' : '#c8a878', backgroundColor: '#1e1206' }}
                  />
                  {i < submissions.length - 1 && (
                    <div className="flex-1 w-px mt-1" style={{ backgroundColor: '#3d2810' }} />
                  )}
                </div>
                {/* Timestamp + card */}
                <div className="flex-1 pb-5">
                  <p className="text-[11px] mb-1.5 mt-3" style={{ color: '#a08060' }}>
                    {formatTime(sub.updatedAt)}
                    <span className="mx-1.5 opacity-50">·</span>
                    {timeAgo(sub.updatedAt)}
                  </p>
                  <PostCard sub={sub} fresh={freshIds.has(sub.id)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {submissions.length > 0 && (
          <p className="text-center text-[11px] py-6" style={{ color: '#c8a878' }}>
            · {submissions.length} moment{submissions.length !== 1 ? 's' : ''} shared ·
          </p>
        )}
      </main>
    </div>
  );
}
