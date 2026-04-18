'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type GallerySubmission, type GlimpseProject } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function SubmissionCard({
  sub,
  onToggle,
}: {
  sub: GallerySubmission;
  onToggle: (sub: GallerySubmission) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const featuredPhoto = sub.photos.find(p => p.id === sub.featuredPhotoId) ?? sub.photos[0];
  const extraCount = sub.photos.length - 1;

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(sub);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white/5 border rounded-2xl overflow-hidden flex flex-col ${
      sub.approved ? 'border-green-500/30' : 'border-white/10'
    }`}>
      {/* Featured photo */}
      <div className="h-44 bg-black/20 relative flex-shrink-0">
        {featuredPhoto ? (
          <img src={photoUrl(featuredPhoto.url)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">No photo</div>
        )}
        {sub.approved && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Live
          </div>
        )}
        {extraCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            +{extraCount} more
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-white font-semibold text-sm">{sub.guestName}</p>
          {sub.message && (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-2 italic">"{sub.message}"</p>
          )}
        </div>

        {/* Photo strip */}
        {sub.photos.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {sub.photos.map(p => (
              <div
                key={p.id}
                className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                  p.id === sub.featuredPhotoId ? 'border-amber-400' : 'border-transparent'
                }`}
              >
                <img src={photoUrl(p.url)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full py-2 text-sm font-medium rounded-xl transition-colors mt-auto disabled:opacity-50 ${
            sub.approved
              ? 'bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400'
              : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
          }`}
        >
          {loading ? '…' : sub.approved ? 'Remove from live feed' : 'Approve for live feed'}
        </button>
      </div>
    </div>
  );
}

export default function MomentsModerationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<GlimpseProject | null>(null);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    api.getProject(params.id)
      .then(async (p) => {
        setProject(p);
        if (p.gallery) {
          const subs = await api.listSubmissions(p.gallery.id);
          setSubmissions(subs);
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleToggleApprove = async (sub: GallerySubmission) => {
    if (!project?.gallery) return;
    const updated = await api.approveSubmission(project.gallery.id, sub.id, !sub.approved);
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleToggleOpen = async () => {
    if (!project?.gallery) return;
    setTogglingOpen(true);
    try {
      const updated = await api.setGalleryOpen(project.gallery.id, !project.gallery.isOpen);
      setProject(prev =>
        prev ? { ...prev, gallery: prev.gallery ? { ...prev.gallery, isOpen: updated.isOpen } : null } : null
      );
    } finally {
      setTogglingOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!project || !project.gallery) {
    return (
      <DashboardShell>
        <div className="px-8 py-8">
          <p className="text-gray-400 text-sm">Gallery not found.</p>
        </div>
      </DashboardShell>
    );
  }

  const pending = submissions.filter(s => !s.approved);
  const approved = submissions.filter(s => s.approved);

  return (
    <DashboardShell>
      <div className="px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push(`/events/${params.id}`)}
              className="text-xs text-gray-500 hover:text-gray-300 mb-2 block transition-colors"
            >
              ← {project.title}
            </button>
            <h1 className="text-2xl font-bold text-white">Moments</h1>
            <p className="text-sm text-gray-400 mt-1">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · {approved.length} live
            </p>
          </div>

          <button
            onClick={handleToggleOpen}
            disabled={togglingOpen}
            className={`mt-7 px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 border flex-shrink-0 ${
              project.gallery.isOpen
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
            }`}
          >
            {project.gallery.isOpen ? 'Close gallery' : 'Open gallery'}
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            No submissions yet. Share the QR code with guests to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {pending.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                  Pending review ({pending.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pending.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} />
                  ))}
                </div>
              </section>
            )}

            {approved.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                  Live on feed ({approved.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approved.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
