'use client';

import { useState, useRef, useEffect } from 'react';
import { api, type GalleryPhoto, type GallerySubmission } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
const MAX_PHOTOS = 3;

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// ─── Closed / Ended states ───────────────────────────────────────────────────

function ClosedScreen({ ended, eventTitle }: { ended: boolean; eventTitle: string }) {
  return (
    <Shell eventTitle={eventTitle}>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <span className="text-4xl">{ended ? '🌅' : '⏸️'}</span>
        <div>
          <p className="text-white font-semibold text-base mb-1">
            {ended ? 'This event has ended' : 'Submissions are paused'}
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            {ended
              ? 'Thank you for being part of it.'
              : 'The host has paused photo uploads. Check back soon.'}
          </p>
        </div>
      </div>
    </Shell>
  );
}

// ─── Thank-you screen ────────────────────────────────────────────────────────

function DoneScreen({ eventTitle, galleryId }: { eventTitle: string; galleryId: string }) {
  return (
    <Shell eventTitle={eventTitle}>
      <div className="flex flex-col items-center text-center gap-5 py-10">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-lg mb-1">Your moment is live</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Pending host approval — it'll appear on the feed shortly.
          </p>
        </div>
        <a
          href={`/g/${galleryId}/feed`}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
        >
          See the live feed →
        </a>
      </div>
    </Shell>
  );
}

// ─── Main upload form ────────────────────────────────────────────────────────

function MomentForm({
  eventTitle,
  galleryId,
  onDone,
}: {
  eventTitle: string;
  galleryId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [submission, setSubmission] = useState<GallerySubmission | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = name.trim().length > 0 && photos.length > 0 && !posting;

  const ensureSubmission = async (): Promise<GallerySubmission> => {
    if (submission) return submission;
    const sub = await api.createSubmission(galleryId, {
      guestName: name.trim(),
      message: caption.trim() || undefined,
    });
    setSubmission(sub);
    return sub;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || photos.length >= MAX_PHOTOS) return;
    if (!name.trim()) {
      setError('Enter your name before adding photos.');
      return;
    }
    const toUpload = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    setUploading(true);
    setError(null);
    try {
      const sub = await ensureSubmission();
      const uploaded: GalleryPhoto[] = [];
      for (const file of toUpload) {
        const photo = await api.uploadMomentPhoto(sub.token, file);
        uploaded.push(photo);
      }
      setPhotos(prev => [...prev, ...uploaded]);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!submission) return;
    try {
      await api.deleteMomentPhoto(submission.token, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (e: any) {
      setError(e.message ?? 'Failed to remove photo');
    }
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    try {
      const sub = await ensureSubmission();
      await api.finaliseSubmission(sub.token, caption.trim() || undefined);
      onDone();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      setPosting(false);
    }
  };

  return (
    <Shell eventTitle={eventTitle}>
      <div className="flex flex-col gap-5">
        {/* Headline */}
        <div className="text-center">
          <p className="text-white font-bold text-xl">Share a Moment</p>
          <p className="text-gray-500 text-xs mt-1">{eventTitle}</p>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400">Your name</label>
          <input
            autoFocus
            type="text"
            maxLength={80}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jane Smith"
            className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-amber-500/60 placeholder:text-gray-600"
          />
        </div>

        {/* Photo area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Photos</label>
            <span className="text-xs text-gray-600">{photos.length}/{MAX_PHOTOS}</span>
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-wide bg-amber-500 text-black px-1.5 py-0.5 rounded-full">
                      Main
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs items-center justify-center hidden group-hover:flex hover:bg-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/40 flex flex-col items-center justify-center text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-40"
                >
                  {uploading ? (
                    <span className="text-[10px] animate-pulse">…</span>
                  ) : (
                    <span className="text-2xl leading-none">+</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Empty state tap target */}
          {photos.length === 0 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-white/15 hover:border-amber-500/40 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-40"
            >
              {uploading ? (
                <span className="text-sm animate-pulse">Uploading…</span>
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="text-xs">Tap to add a photo</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {/* Caption */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400">Caption <span className="text-gray-600">(optional)</span></label>
          <textarea
            maxLength={200}
            rows={2}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's happening right now?"
            className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-amber-500/60 placeholder:text-gray-600 resize-none"
          />
          <p className="text-[11px] text-gray-600 text-right">{caption.length}/200</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Post button */}
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-sm rounded-xl transition-colors"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </Shell>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function GuestUploadPage({ params }: { params: { galleryId: string } }) {
  const [eventTitle, setEventTitle] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [ended, setEnded] = useState(false);
  const [done, setDone] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.getGallery(params.galleryId)
      .then(g => {
        setEventTitle(g.project.title);
        setIsOpen(g.isOpen);
        setEnded(!!g.endedAt);
      })
      .catch(() => setInitError('Gallery not found.'))
      .finally(() => setReady(true));
  }, [params.galleryId]);

  if (!ready) {
    return (
      <Shell eventTitle="">
        <p className="text-gray-400 text-sm animate-pulse text-center py-12">Loading…</p>
      </Shell>
    );
  }

  if (initError) {
    return (
      <Shell eventTitle="">
        <p className="text-red-400 text-sm text-center py-12">{initError}</p>
      </Shell>
    );
  }

  if (done) return <DoneScreen eventTitle={eventTitle} galleryId={params.galleryId} />;
  if (!isOpen) return <ClosedScreen ended={ended} eventTitle={eventTitle} />;

  return (
    <MomentForm
      eventTitle={eventTitle}
      galleryId={params.galleryId}
      onDone={() => setDone(true)}
    />
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function Shell({ children, eventTitle }: { children: React.ReactNode; eventTitle: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-sm font-bold text-white tracking-tight">Glimpse</span>
          <span className="mx-2 text-gray-600">·</span>
          <span className="text-sm text-amber-400">Glimpses</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
