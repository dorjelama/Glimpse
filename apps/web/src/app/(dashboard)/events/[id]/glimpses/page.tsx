'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type GallerySubmission, type GlimpseProject } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

function photoUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function galleryStatus(gallery: { isOpen: boolean; endedAt?: string }) {
  if (gallery.endedAt) return 'ended';
  if (!gallery.isOpen) return 'closed';
  return 'open';
}

function StatusBadge({ status }: { status: 'open' | 'closed' | 'ended' }) {
  const styles = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-amber-100 text-amber-700',
    ended: 'bg-blush text-ink/50 border border-gold/20',
  };
  const labels = { open: 'Open', closed: 'Closed', ended: 'Ended' };
  return (
    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function SubmissionCard({
  sub,
  onToggle,
  onDelete,
}: {
  sub: GallerySubmission;
  onToggle: (sub: GallerySubmission) => Promise<void>;
  onDelete: (sub: GallerySubmission) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const featuredPhoto = sub.photos.find(p => p.id === sub.featuredPhotoId) ?? sub.photos[0];
  const extraCount = sub.photos.length - 1;

  const handleToggle = async () => {
    setLoading(true);
    try { await onToggle(sub); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(sub); } finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className={`bg-cream border rounded-2xl overflow-hidden flex flex-col ${
      sub.approved ? 'border-green-300' : 'border-gold/30'
    }`}>
      <div className="h-44 bg-blush relative flex-shrink-0">
        {featuredPhoto ? (
          <img src={photoUrl(featuredPhoto.url)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-ink/30 text-sm">No photo</div>
        )}
        {sub.approved && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Live
          </div>
        )}
        {extraCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-ink/60 text-cream text-[10px] px-2 py-0.5 rounded-full">
            +{extraCount} more
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-ink font-semibold text-sm">{sub.guestName}</p>
          {sub.message && (
            <p className="text-ink/50 text-xs mt-1 leading-relaxed line-clamp-2 italic">"{sub.message}"</p>
          )}
        </div>

        {sub.photos.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {sub.photos.map(p => (
              <div
                key={p.id}
                className={`w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                  p.id === sub.featuredPhotoId ? 'border-terra' : 'border-transparent'
                }`}
              >
                <img src={photoUrl(p.url)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={handleToggle}
            disabled={loading || deleting}
            className={`w-full py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
              sub.approved
                ? 'bg-ink/5 hover:bg-red-50 text-ink/50 hover:text-red-600 border border-gold/20'
                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
            }`}
          >
            {loading ? '…' : sub.approved ? 'Remove from feed' : 'Approve for feed'}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading || deleting}
              className="w-full py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-blush hover:bg-red-50 text-ink/40 hover:text-red-500 border border-gold/20 hover:border-red-200"
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2 text-sm rounded-xl bg-blush hover:bg-gold/20 text-ink/50 border border-gold/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GlimpsesModerationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<GlimpseProject | null>(null);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    api.getProject(params.id)
      .then(async (p) => {
        setProject(p);
        if (p.gallery) {
          const subs = await api.listSubmissions(p.gallery.id);
          setSubmissions(subs);
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleToggleApprove = async (sub: GallerySubmission) => {
    if (!project?.gallery) return;
    const updated = await api.approveSubmission(project.gallery.id, sub.id, !sub.approved);
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDelete = async (sub: GallerySubmission) => {
    if (!project?.gallery) return;
    await api.deleteSubmission(project.gallery.id, sub.id);
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
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

  const handleDownload = async () => {
    if (!project?.gallery) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await api.exportGallery(project.gallery.id);
    } catch (e: any) {
      setDownloadError(e.message ?? 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleEndEvent = async () => {
    if (!project?.gallery) return;
    setEnding(true);
    try {
      const updated = await api.endGallery(project.gallery.id);
      setProject(prev =>
        prev ? { ...prev, gallery: prev.gallery ? { ...prev.gallery, isOpen: updated.isOpen, endedAt: updated.endedAt } : null } : null
      );
      setConfirmEnd(false);
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-full bg-cream flex items-center justify-center">
          <p className="text-ink/40 text-sm animate-pulse">Loading…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!project || !project.gallery) {
    return (
      <DashboardShell>
        <div className="min-h-full bg-cream px-8 py-8">
          <p className="text-ink/40 text-sm">Gallery not found.</p>
        </div>
      </DashboardShell>
    );
  }

  const gallery = project.gallery;
  const status = galleryStatus(gallery);
  const pending = submissions.filter(s => !s.approved);
  const approved = submissions.filter(s => s.approved);

  const exportWindowDays = gallery.endedAt
    ? Math.ceil((new Date(gallery.endedAt).getTime() + 30 * 86_400_000 - Date.now()) / 86_400_000)
    : null;
  const exportExpired = exportWindowDays !== null && exportWindowDays <= 0;

  return (
    <DashboardShell>
      <div className="min-h-full bg-cream px-4 py-6 md:px-8 md:py-8 max-w-4xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push(`/events/${params.id}`)}
              className="text-xs text-ink/40 hover:text-ink mb-2 block transition-colors"
            >
              ← {project.title}
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>Glimpses</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-ink/40 mt-1">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · {approved.length} live
            </p>
          </div>

          {/* Gallery controls */}
          {status !== 'ended' && (
            <div className="flex gap-2 flex-shrink-0 md:mt-7 w-full md:w-auto">
              <button
                onClick={handleToggleOpen}
                disabled={togglingOpen}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 border ${
                  status === 'open'
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                    : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200'
                }`}
              >
                {status === 'open' ? 'Pause submissions' : 'Resume submissions'}
              </button>

              {!confirmEnd ? (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl transition-colors border bg-blush hover:bg-gold/20 text-ink/50 hover:text-ink border-gold/30"
                >
                  End event
                </button>
              ) : (
                <div className="flex-1 md:flex-none flex gap-2 items-center">
                  <span className="hidden md:inline text-xs text-ink/50">Are you sure?</span>
                  <button
                    onClick={handleEndEvent}
                    disabled={ending}
                    className="flex-1 md:flex-none px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50"
                  >
                    {ending ? 'Ending…' : 'Yes, end'}
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    className="flex-1 md:flex-none px-3 py-2 text-xs rounded-xl bg-blush hover:bg-gold/20 text-ink/50 border border-gold/20"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export banner */}
        {status === 'ended' && (
          <div className="mb-6 rounded-2xl border border-gold/30 bg-blush px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Download your Glimpses</p>
              {exportExpired ? (
                <p className="text-xs text-ink/40 mt-0.5">Export window has expired · photos will be removed shortly</p>
              ) : (
                <p className="text-xs text-ink/50 mt-0.5">
                  ZIP of all approved photos · {exportWindowDays} day{exportWindowDays !== 1 ? 's' : ''} remaining
                </p>
              )}
              {downloadError && <p className="text-xs text-red-500 mt-1">{downloadError}</p>}
            </div>
            {!exportExpired && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 bg-terra hover:bg-terra/90 text-white"
              >
                {downloading ? 'Preparing…' : 'Download ZIP'}
              </button>
            )}
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="text-center py-20 text-ink/40 text-sm">
            No submissions yet. Share the QR code with guests to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {pending.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-ink/30 uppercase tracking-widest mb-4">
                  Pending review ({pending.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pending.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            )}

            {approved.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-ink/30 uppercase tracking-widest mb-4">
                  Live on feed ({approved.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approved.map(sub => (
                    <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} onDelete={handleDelete} />
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
