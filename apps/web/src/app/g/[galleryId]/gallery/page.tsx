'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const EXPORT_WINDOW_DAYS = 30;

interface GalleryPhoto { id: string; url: string; }
interface Submission {
  id: string;
  guestName: string;
  message?: string;
  featuredPhotoId?: string;
  photos: GalleryPhoto[];
  updatedAt: string;
}
interface GalleryData {
  gallery: { id: string; isOpen: boolean; endedAt?: string; project: { title: string } };
  submissions: Submission[];
  nextCursor: string | null;
}

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function GalleryPage({ params }: { params: { galleryId: string } }) {
  const [data, setData] = useState<GalleryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch up to 200 approved submissions — gallery is a static archive
        const res = await fetch(`${API_URL}/gallery/${params.galleryId}/feed?limit=200&sessionId=gallery`);
        if (!res.ok) { setError('Gallery not found.'); return; }
        const json: GalleryData = await res.json();

        if (!json.gallery.endedAt) { setError('This event is still live.'); return; }

        const expiredAt = new Date(json.gallery.endedAt).getTime() + EXPORT_WINDOW_DAYS * 86_400_000;
        if (Date.now() > expiredAt) { setExpired(true); return; }

        setData(json);
      } catch {
        setError('Unable to load gallery.');
      }
    };
    load();
  }, [params.galleryId]);

  if (expired) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3 px-6">
          <span className="text-4xl opacity-40">📷</span>
          <p className="text-white font-semibold">This gallery is no longer available</p>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            The 30-day archive window has closed and photos have been removed.
          </p>
          <a href="/" className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Create your own event with Glimpse →
          </a>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
        </div>
      </Shell>
    );
  }

  const { gallery, submissions } = data;
  const approved = submissions.filter(s => !('pending' in s));

  return (
    <Shell>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ backgroundColor: 'rgba(15,8,30,0.85)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#f59e0b' }}>Glimpse</p>
            <h1 className="text-base font-semibold text-white leading-snug mt-0.5">{gallery.project.title}</h1>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Ended</p>
            <p className="text-xs text-white font-medium">{formatDate(gallery.endedAt!)}</p>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {approved.length} moment{approved.length !== 1 ? 's' : ''} captured
        </p>
      </div>

      {/* Photo grid */}
      <main className="max-w-2xl mx-auto px-4 pb-16">
        {approved.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No photos in this gallery.</p>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            {approved.map(sub => {
              const featured = sub.photos.find(p => p.id === sub.featuredPhotoId) ?? sub.photos[0];
              if (!featured) return null;
              return (
                <div
                  key={sub.id}
                  className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group relative"
                  onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                >
                  <img
                    src={photoUrl(featured.url)}
                    alt=""
                    className="w-full block object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Caption overlay on hover */}
                  {(sub.message || sub.guestName) && (
                    <div
                      className="absolute inset-x-0 bottom-0 p-3 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
                    >
                      <p className="text-white text-xs font-semibold leading-tight">{sub.guestName}</p>
                      {sub.message && <p className="text-white/70 text-[11px] mt-0.5 leading-snug line-clamp-2">{sub.message}</p>}
                    </div>
                  )}
                  {/* Extra photos badge */}
                  {sub.photos.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      +{sub.photos.length - 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Watermark footer */}
      <footer className="border-t py-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <a
          href="/"
          className="text-xs transition-colors hover:text-amber-400"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Powered by <strong className="font-semibold">Glimpse</strong> · Create your own event →
        </a>
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f051e 0%, #1a0d2e 50%, #0d0a1f 100%)' }}>
      {children}
    </div>
  );
}
