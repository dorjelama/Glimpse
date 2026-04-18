'use client';

import { useState, useRef } from 'react';
import { api, type GalleryPhoto, type GallerySubmission } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
const MAX_PHOTOS = 5;

type Step = 'info' | 'upload' | 'featured' | 'done';

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// ─── Step 1: Guest info ──────────────────────────────────────────────────────

function InfoStep({
  eventTitle,
  onNext,
}: {
  eventTitle: string;
  onNext: (name: string, message: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onNext(name.trim(), message.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">{eventTitle}</h2>
        <p className="text-gray-400 text-sm">Share a moment from today. Upload up to {MAX_PHOTOS} photos.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">Your name</label>
        <input
          required
          autoFocus
          type="text"
          maxLength={80}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-amber-500/60 placeholder:text-gray-600"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400">Message <span className="text-gray-600">(optional)</span></label>
        <textarea
          maxLength={300}
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="A little note for the couple…"
          className="w-full bg-white/5 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-amber-500/60 placeholder:text-gray-600 resize-none"
        />
        <p className="text-[11px] text-gray-600 text-right">{message.length}/300</p>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm rounded-xl transition-colors"
      >
        {loading ? 'Starting…' : 'Continue →'}
      </button>
    </form>
  );
}

// ─── Step 2: Upload photos ──────────────────────────────────────────────────

function UploadStep({
  token,
  photos,
  onPhotosChange,
  onNext,
  onBack,
}: {
  token: string;
  photos: GalleryPhoto[];
  onPhotosChange: (photos: GalleryPhoto[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const uploaded: GalleryPhoto[] = [];
      for (const file of toUpload) {
        const photo = await api.uploadMomentPhoto(token, file);
        uploaded.push(photo);
      }
      onPhotosChange([...photos, ...uploaded]);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await api.deleteMomentPhoto(token, photoId);
      onPhotosChange(photos.filter(p => p.id !== photoId));
    } catch (e: any) {
      setError(e.message ?? 'Failed to remove photo');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Upload photos</h2>
        <p className="text-gray-400 text-sm">{photos.length}/{MAX_PHOTOS} photos added</p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {photos.length < MAX_PHOTOS && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-white/20 hover:border-amber-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-sm animate-pulse">Uploading…</span>
          ) : (
            <>
              <span className="text-2xl">+</span>
              <span className="text-xs">Tap to add photos ({MAX_PHOTOS - photos.length} remaining)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={photos.length === 0}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm rounded-xl transition-colors"
        >
          Choose featured photo →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Pick featured ──────────────────────────────────────────────────

function FeaturedStep({
  token,
  photos,
  featuredId,
  onFeaturedChange,
  onSubmit,
  onBack,
}: {
  token: string;
  photos: GalleryPhoto[];
  featuredId?: string;
  onFeaturedChange: (id: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (photoId: string) => {
    try {
      await api.setFeaturedPhoto(token, photoId);
      onFeaturedChange(photoId);
    } catch (e: any) {
      setError(e.message ?? 'Failed to select photo');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit();
    } catch (e: any) {
      setError(e.message ?? 'Submission failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Pick your featured photo</h2>
        <p className="text-gray-400 text-sm">This one will appear in the live feed (pending host approval).</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map(photo => {
          const selected = photo.id === featuredId;
          return (
            <button
              key={photo.id}
              onClick={() => handleSelect(photo.id)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                selected ? 'border-amber-400 shadow-lg shadow-amber-500/30' : 'border-transparent hover:border-white/30'
              }`}
            >
              <img src={photoUrl(photo.url)} alt="" className="w-full h-full object-cover" />
              {selected && (
                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!featuredId || loading}
          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm rounded-xl transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

// ─── Done ───────────────────────────────────────────────────────────────────

function DoneStep({ eventTitle }: { eventTitle: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-8">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
        🎉
      </div>
      <div>
        <h2 className="text-white font-semibold text-lg mb-2">You're in the album!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your photo is waiting for approval and will appear in the {eventTitle} live feed shortly.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function GuestUploadPage({ params }: { params: { galleryId: string } }) {
  const [step, setStep] = useState<Step>('info');
  const [eventTitle, setEventTitle] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [submission, setSubmission] = useState<GallerySubmission | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [featuredId, setFeaturedId] = useState<string | undefined>();
  const [initError, setInitError] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  // Fetch gallery info once on mount
  useState(() => {
    api.getGallery(params.galleryId)
      .then(g => {
        setEventTitle(g.project.title);
        setGalleryOpen(g.isOpen);
      })
      .catch(() => setInitError('This gallery could not be found.'))
      .finally(() => setInitialised(true));
  });

  const handleInfoNext = async (name: string, message: string) => {
    const sub = await api.createSubmission(params.galleryId, { guestName: name, message: message || undefined });
    setSubmission(sub);
    setStep('upload');
  };

  const handleSubmit = async () => {
    if (!submission) return;
    await api.finaliseSubmission(submission.token);
    setStep('done');
  };

  if (!initialised) {
    return (
      <Shell>
        <p className="text-gray-400 text-sm animate-pulse text-center py-12">Loading…</p>
      </Shell>
    );
  }

  if (initError) {
    return (
      <Shell>
        <p className="text-red-400 text-sm text-center py-12">{initError}</p>
      </Shell>
    );
  }

  if (!galleryOpen) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-2xl mb-3">🔒</p>
          <p className="text-white font-semibold mb-1">Gallery is closed</p>
          <p className="text-gray-400 text-sm">The host has closed photo uploads for this event.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Step indicator */}
      {step !== 'done' && (
        <div className="flex gap-1.5 mb-6">
          {(['info', 'upload', 'featured'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step === s ? 'bg-amber-400' : i < ['info', 'upload', 'featured'].indexOf(step) ? 'bg-amber-400/40' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {step === 'info' && (
        <InfoStep eventTitle={eventTitle} onNext={handleInfoNext} />
      )}
      {step === 'upload' && submission && (
        <UploadStep
          token={submission.token}
          photos={photos}
          onPhotosChange={setPhotos}
          onNext={() => setStep('featured')}
          onBack={() => setStep('info')}
        />
      )}
      {step === 'featured' && submission && (
        <FeaturedStep
          token={submission.token}
          photos={photos}
          featuredId={featuredId}
          onFeaturedChange={setFeaturedId}
          onSubmit={handleSubmit}
          onBack={() => setStep('upload')}
        />
      )}
      {step === 'done' && <DoneStep eventTitle={eventTitle} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-sm font-bold text-white tracking-tight">Glimpse</span>
          <span className="mx-2 text-gray-600">·</span>
          <span className="text-sm text-amber-400">Moments</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
