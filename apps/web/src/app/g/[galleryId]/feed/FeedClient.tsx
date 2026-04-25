'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Stable per-device session ID — persisted in localStorage
function getSessionId(): string {
  let id = localStorage.getItem('glimpse-session-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('glimpse-session-id', id);
  }
  return id;
}

function getTokenMap(galleryId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(`glimpse-token-map:${galleryId}`) || '{}');
  } catch {
    return {};
  }
}

function getOwnTokens(galleryId: string): string[] {
  return Object.values(getTokenMap(galleryId));
}

function removeTokenEntry(galleryId: string, submissionId: string) {
  try {
    const key = `glimpse-token-map:${galleryId}`;
    const map = getTokenMap(galleryId);
    delete map[submissionId];
    localStorage.setItem(key, JSON.stringify(map));
  } catch { /* ignore */ }
}
const POLL_FALLBACK_MS = 30_000;
const SSE_FAIL_THRESHOLD = 3;

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
  reactionCounts: Record<string, number>;
  myReactions: string[];
  pending?: boolean;
}

interface FeedData {
  gallery: { id: string; isOpen: boolean; endedAt?: string; project: { title: string } };
  submissions: FeedSubmission[];
  nextCursor: string | null;
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

// ── Reactions ─────────────────────────────────────────────────────────────────

const REACTIONS = ['❤️', '🎉', '😂', '😮', '👏', '🥰'] as const;
type Reaction = typeof REACTIONS[number];

// ── Post card ────────────────────────────────────────────────────────────────

function PostCard({ sub, fresh, onReact, onDelete }: {
  sub: FeedSubmission;
  fresh: boolean;
  onReact: (emoji: Reaction) => void;
  onDelete?: () => void;
}) {
  const myReactions = (sub.myReactions ?? []) as Reaction[];
  const reactionCounts = sub.reactionCounts ?? {};
  const featured = sub.photos.find(p => p.id === sub.featuredPhotoId) ?? sub.photos[0];
  const rest = sub.photos.filter(p => p.id !== featured?.id);
  const pending = !!sub.pending;

  return (
    <article
      className={`rounded-2xl overflow-hidden shadow-md transition-all duration-700 ${
        fresh
          ? 'ring-2 ring-amber-400/70 shadow-amber-200/40'
          : 'ring-0'
      }`}
      style={{
        backgroundColor: '#fffdf7',
        border: pending ? '1px dashed #d4a574' : '1px solid #e8d9bd',
        opacity: pending ? 0.92 : 1,
      }}
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
            {pending && (
              <span className="ml-1.5 text-[10px] font-normal" style={{ color: '#b07050' }}>(you)</span>
            )}
          </p>
        </div>
        {pending ? (
          <span className="ml-auto text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#fde8d1', color: '#92400e' }}>
            Pending
          </span>
        ) : fresh && (
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
        <div style={{ backgroundColor: '#1e1206', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src={photoUrl(featured.url)}
            alt=""
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '560px',
              width: 'auto',
              height: 'auto',
              margin: '0 auto',
              filter: 'sepia(8%) contrast(0.97) brightness(1.02)',
            }}
          />
        </div>
      )}

      {/* Additional photos — row for landscape, column for portrait feel */}
      {rest.length > 0 && (
        <div className="flex gap-px" style={{ backgroundColor: '#1e1206' }}>
          {rest.map(p => (
            <div key={p.id} className="flex-1 overflow-hidden flex items-center justify-center" style={{ maxHeight: '200px', backgroundColor: '#1e1206' }}>
              <img
                src={photoUrl(p.url)}
                alt=""
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '200px',
                  width: 'auto',
                  height: 'auto',
                  filter: 'sepia(8%) contrast(0.97)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pending notice — only visible to the uploader */}
      {pending && (
        <div className="px-4 py-3 text-[11px] flex items-center justify-between gap-3" style={{ borderTop: '1px solid #f0e0c8', color: '#8a6840', backgroundColor: '#fff8ec' }}>
          <span>Visible only to you — waiting for host approval.</span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-shrink-0 text-[11px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: '#b05030' }}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Reactions (hidden while pending) */}
      {!pending && (
      <div className="px-3 py-3" style={{ borderTop: '1px solid #f0e0c8' }}>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {REACTIONS.map(emoji => {
              const active = myReactions.includes(emoji);
              const count = reactionCounts[emoji] ?? 0;
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl text-sm transition-all active:scale-90 select-none"
                  style={{
                    backgroundColor: active ? '#fef3c7' : count > 0 ? '#fdf8f0' : 'transparent',
                    border: active ? '1.5px solid #f59e0b' : count > 0 ? '1.5px solid #f0e0c8' : '1.5px solid transparent',
                  }}
                  aria-label={emoji}
                  aria-pressed={active}
                >
                  <span>{emoji}</span>
                  {count > 0 && (
                    <span className="text-[11px] font-semibold leading-none" style={{ color: active ? '#92400e' : '#a08060' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-semibold tracking-widest uppercase pl-2" style={{ color: '#c8a878' }}>
            Glimpse
          </span>
        </div>
      </div>
      )}
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

export default function FeedClient({ params }: { params: { galleryId: string } }) {
  const [data, setData] = useState<FeedData | null>(null);
  const [submissions, setSubmissions] = useState<FeedSubmission[]>([]);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const loadingMoreRef = useRef(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const tokens = getOwnTokens(params.galleryId);
      const qs = new URLSearchParams({ sessionId });
      if (tokens.length > 0) qs.set('tokens', tokens.join(','));
      const res = await fetch(`${API_URL}/gallery/${params.galleryId}/feed?${qs}`);
      if (!res.ok) { setError(true); return; }
      const json: FeedData = await res.json();

      setData(json);
      setNextCursor(json.nextCursor);
      setHasMore(!!json.nextCursor);
      const incoming = json.submissions;

      if (firstLoad.current) {
        incoming.forEach(s => seenRef.current.add(s.id));
        setSubmissions(incoming);
        firstLoad.current = false;
      } else {
        // Polling fallback: prepend any new items, keep paginated state
        const newOnes = incoming.filter(s => !seenRef.current.has(s.id));
        if (newOnes.length > 0) {
          newOnes.forEach(s => seenRef.current.add(s.id));
          setSubmissions(prev => [...newOnes, ...prev]);
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

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const sessionId = getSessionId();
      const qs = new URLSearchParams({ sessionId, cursor: nextCursor });
      const res = await fetch(`${API_URL}/gallery/${params.galleryId}/feed?${qs}`);
      if (!res.ok) return;
      const json: FeedData = await res.json();
      const incoming = json.submissions;
      incoming.forEach(s => seenRef.current.add(s.id));
      setSubmissions(prev => [...prev, ...incoming]);
      setNextCursor(json.nextCursor);
      setHasMore(!!json.nextCursor);
    } catch { /* ignore — user can scroll back to retry */ }
    finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [nextCursor, params.galleryId]);

  const markFresh = useCallback((id: string) => {
    setFreshIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setFreshIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 6_000);
  }, []);

  useEffect(() => {
    fetchFeed();

    if (typeof EventSource === 'undefined') {
      const id = setInterval(fetchFeed, POLL_FALLBACK_MS);
      return () => clearInterval(id);
    }

    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let failures = 0;
    let closed = false;

    const startPollingFallback = () => {
      if (pollId) return;
      pollId = setInterval(fetchFeed, POLL_FALLBACK_MS);
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource(`${API_URL}/gallery/${params.galleryId}/feed/stream`);

      es.onopen = () => {
        failures = 0;
        if (pollId) { clearInterval(pollId); pollId = null; }
      };

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'submission.approved') {
            const s = event.payload as FeedSubmission;
            setSubmissions(prev => {
              const existingIdx = prev.findIndex(p => p.id === s.id);
              if (existingIdx >= 0) {
                // Replace pending (or refreshed) entry in place, preserve myReactions
                const next = [...prev];
                next[existingIdx] = { ...s, pending: false, myReactions: prev[existingIdx].myReactions };
                return next;
              }
              seenRef.current.add(s.id);
              return [{ ...s, pending: false }, ...prev];
            });
            markFresh(s.id);
          } else if (event.type === 'submission.deleted') {
            const { id } = event.payload;
            seenRef.current.delete(id);
            setSubmissions(prev => prev.filter(s => s.id !== id));
          } else if (event.type === 'reaction.changed') {
            const { submissionId, reactionCounts } = event.payload;
            setSubmissions(prev => prev.map(s =>
              s.id === submissionId ? { ...s, reactionCounts } : s
            ));
          } else if (event.type === 'gallery.updated') {
            const { isOpen, endedAt } = event.payload;
            setData(prev => prev ? { ...prev, gallery: { ...prev.gallery, isOpen, endedAt: endedAt ?? undefined } } : null);
          }
        } catch { /* ignore malformed */ }
      };

      es.onerror = () => {
        failures++;
        es?.close();
        es = null;
        if (failures >= SSE_FAIL_THRESHOLD) {
          startPollingFallback();
        } else {
          setTimeout(connect, 2_000 * failures);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      es?.close();
      if (pollId) clearInterval(pollId);
    };
  }, [fetchFeed, markFresh, params.galleryId]);

  // IntersectionObserver: trigger loadMore when sentinel enters viewport
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

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
      <header style={{ backgroundColor: '#B85C37', borderBottom: '2px solid #9e4e2f' }} className="sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate" style={{ color: '#F6EBDD' }}>
              {data.gallery.project.title}
            </p>
            <p className="text-[11px]" style={{ color: '#f6ebddaa' }}>Glimpses · Live feed</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: data.gallery.isOpen ? '#86efac' : '#f6ebdd66' }}
              />
              <span className="text-[11px] font-medium" style={{ color: data.gallery.isOpen ? '#86efac' : '#f6ebdd99' }}>
                {data.gallery.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <button
              onClick={async () => { setRefreshing(true); await fetchFeed(); setRefreshing(false); }}
              disabled={refreshing}
              title="Refresh feed"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#9e4e2f', color: '#F6EBDD' }}
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
            className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            style={{ backgroundColor: '#f5ebe0', border: '1px solid #e8d9bd' }}
          >
            <p className="text-[12px] text-center sm:text-left" style={{ color: '#8a6840' }}>
              This event has ended · {new Date(data.gallery.endedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <a
              href={`/g/${params.galleryId}/gallery`}
              className="text-[12px] font-semibold text-center whitespace-nowrap transition-colors hover:opacity-80"
              style={{ color: '#B85C37' }}
            >
              View final gallery →
            </a>
          </div>
        </div>
      )}

      {/* Feed */}
      <main className={`max-w-lg mx-auto px-4 pt-6 ${data.gallery.isOpen && !data.gallery.endedAt ? 'pb-24' : 'pb-6'}`}>
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
                  <PostCard
                    sub={sub}
                    fresh={freshIds.has(sub.id)}
                    onDelete={sub.pending ? async () => {
                      const token = getTokenMap(params.galleryId)[sub.id];
                      if (!token) return;
                      try {
                        await fetch(`${API_URL}/gallery/submission/${token}`, { method: 'DELETE' });
                        setSubmissions(prev => prev.filter(s => s.id !== sub.id));
                        removeTokenEntry(params.galleryId, sub.id);
                      } catch { /* ignore */ }
                    } : undefined}
                    onReact={async (emoji) => {
                      const sessionId = getSessionId();
                      // Optimistic update
                      setSubmissions(prev => prev.map(s => {
                        if (s.id !== sub.id) return s;
                        const active = s.myReactions.includes(emoji);
                        return {
                          ...s,
                          myReactions: active ? s.myReactions.filter(e => e !== emoji) : [...s.myReactions, emoji],
                          reactionCounts: {
                            ...s.reactionCounts,
                            [emoji]: Math.max(0, (s.reactionCounts[emoji] ?? 0) + (active ? -1 : 1)),
                          },
                        };
                      }));
                      // Sync to server
                      try {
                        const result = await fetch(`${API_URL}/gallery/submission/${sub.id}/react`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionId, emoji }),
                        }).then(r => r.json());
                        // Reconcile with server truth
                        setSubmissions(prev => prev.map(s =>
                          s.id === sub.id
                            ? { ...s, reactionCounts: result.reactionCounts, myReactions: result.myReactions }
                            : s
                        ));
                      } catch { /* keep optimistic state on network error */ }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sentinel + footer */}
        {submissions.length > 0 && (
          <>
            {/* IntersectionObserver target — sits 300px below viewport before triggering */}
            <div ref={loaderRef} />
            {loadingMore && (
              <p className="text-center text-[11px] py-4 animate-pulse" style={{ color: '#c8a878' }}>
                Loading more…
              </p>
            )}
            {!hasMore && (
              <p className="text-center text-[11px] py-6" style={{ color: '#c8a878' }}>
                · {submissions.length} glimpse{submissions.length !== 1 ? 's' : ''} shared ·
              </p>
            )}
          </>
        )}
      </main>

      {/* Floating upload button — only when gallery is open */}
      {data.gallery.isOpen && !data.gallery.endedAt && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <a
            href={`/g/${params.galleryId}/upload`}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold shadow-lg transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#B85C37', color: '#F6EBDD', boxShadow: '0 4px 20px rgba(184,92,55,0.45)' }}
          >
            <span>📸</span>
            Share a Glimpse
          </a>
        </div>
      )}
    </div>
  );
}
