'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type GallerySubmission, type GlimpseProject, type GallerySummary } from '@/lib/api';
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

function StatusPill({ status }: { status: 'open' | 'closed' | 'ended' }) {
  const cfg = {
    open:   { bg: 'rgba(134,239,172,0.18)', text: '#86efac', border: 'rgba(134,239,172,0.35)', label: 'Open' },
    closed: { bg: 'rgba(252,211,77,0.18)',  text: '#fcd34d', border: 'rgba(252,211,77,0.35)',  label: 'Closed' },
    ended:  { bg: 'rgba(246,235,221,0.12)', text: 'rgba(246,235,221,0.5)', border: 'rgba(246,235,221,0.2)', label: 'Ended' },
  }[status];
  return (
    <span
      className="inline-flex text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
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

  const cardBg   = sub.approved ? '#f6fef8' : '#fffcf5';
  const cardBorder = sub.approved ? '#bbf7d0' : '#f0d9a8';

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="flex flex-row sm:flex-col">

        {/* Photo */}
        <div className="w-20 self-stretch sm:w-full sm:h-44 relative flex-shrink-0" style={{ backgroundColor: '#e8d5b0' }}>
          {featuredPhoto ? (
            <img src={photoUrl(featuredPhoto.url)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[5rem] text-xs" style={{ color: '#b09060' }}>
              No photo
            </div>
          )}

          {/* Status overlay */}
          {sub.approved && (
            <div
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}
            >
              Live
            </div>
          )}
          {!sub.approved && (
            <div
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[9px] font-bold px-2 py-0.5 rounded-full hidden sm:block"
              style={{ backgroundColor: '#92400e', color: '#fef3c7' }}
            >
              Pending
            </div>
          )}
          {extraCount > 0 && (
            <div
              className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(30,18,6,0.65)', color: '#F6EBDD' }}
            >
              +{extraCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: '#2d1a00' }}>{sub.guestName}</p>
            {sub.message && (
              <p className="text-xs mt-0.5 leading-relaxed line-clamp-1 sm:line-clamp-2 italic" style={{ color: '#8a6040' }}>
                "{sub.message}"
              </p>
            )}
          </div>

          {/* Thumbnail strip — desktop only */}
          {sub.photos.length > 1 && (
            <div className="hidden sm:flex gap-1.5 flex-wrap">
              {sub.photos.map(p => (
                <div
                  key={p.id}
                  className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: p.id === sub.featuredPhotoId ? '2px solid #B85C37' : '2px solid transparent' }}
                >
                  <img src={photoUrl(p.url)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {!confirmDelete ? (
            <div className="flex gap-2 mt-auto">
              <button
                onClick={handleToggle}
                disabled={loading || deleting}
                className="flex-1 py-1.5 sm:py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                style={sub.approved
                  ? { backgroundColor: 'transparent', color: '#9a6040', border: '1px solid #e0c8a0' }
                  : { backgroundColor: '#B85C37', color: '#F6EBDD', border: '1px solid #9e4e2f' }
                }
              >
                {loading ? '…' : sub.approved ? 'Remove' : 'Approve'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={loading || deleting}
                aria-label="Delete submission"
                className="flex-shrink-0 px-3 py-1.5 sm:py-2 text-sm rounded-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: 'transparent', color: '#c0a070', border: '1px solid #e8d5b0' }}
              >
                <span className="sm:hidden">✕</span>
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-auto">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
              >
                {deleting ? '…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-1.5 sm:py-2 text-xs rounded-xl transition-all"
                style={{ backgroundColor: 'transparent', color: '#a08060', border: '1px solid #e8d5b0' }}
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
  const [bulkApproving, setBulkApproving] = useState(false);
  const [galleryCopied, setGalleryCopied] = useState(false);
  const [summary, setSummary] = useState<GallerySummary | null>(null);

  useEffect(() => {
    api.getProject(params.id)
      .then(async (p) => {
        setProject(p);
        if (p.gallery) {
          const subs = await api.listSubmissions(p.gallery.id);
          setSubmissions(subs);
          if (p.gallery.endedAt) {
            api.getGallerySummary(p.gallery.id).then(setSummary).catch(() => {});
          }
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

  const handleBulkApprove = async () => {
    if (!project?.gallery) return;
    setBulkApproving(true);
    try {
      const toApprove = submissions.filter(s => !s.approved);
      for (const sub of toApprove) {
        const updated = await api.approveSubmission(project.gallery.id, sub.id, true);
        setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    } finally {
      setBulkApproving(false);
    }
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
        <div className="min-h-full flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#fdf6e8,#f5e6cc)' }}>
          <p className="text-sm animate-pulse" style={{ color: '#b09070' }}>Loading…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!project || !project.gallery) {
    return (
      <DashboardShell>
        <div className="min-h-full px-8 py-8" style={{ background: 'linear-gradient(160deg,#fdf6e8,#f5e6cc)' }}>
          <p className="text-sm" style={{ color: '#b07050' }}>Gallery not found.</p>
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
      <div className="min-h-full" style={{ background: 'linear-gradient(160deg, #fdf6e8 0%, #f5e6cc 100%)' }}>

        {/* ── Terra header ─────────────────────────────────────── */}
        <div style={{ backgroundColor: '#B85C37', borderBottom: '2px solid #9e4e2f' }} className="px-4 py-5 md:px-8">
          <button
            onClick={() => router.push(`/events/${params.id}`)}
            className="text-xs mb-3 block transition-opacity hover:opacity-80"
            style={{ color: 'rgba(246,235,221,0.6)' }}
          >
            ← {project.title}
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title + stats */}
            <div>
              <div className="flex items-center gap-3">
                <h1
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Georgia, serif', color: '#F6EBDD' }}
                >
                  Glimpses
                </h1>
                <StatusPill status={status} />
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px]" style={{ color: 'rgba(246,235,221,0.55)' }}>
                  {submissions.length} total
                </span>
                <span style={{ color: 'rgba(246,235,221,0.25)' }}>·</span>
                <span className="text-[11px] font-medium" style={{ color: '#86efac' }}>
                  {approved.length} live
                </span>
                {pending.length > 0 && (
                  <>
                    <span style={{ color: 'rgba(246,235,221,0.25)' }}>·</span>
                    <span className="text-[11px] font-medium" style={{ color: '#fcd34d' }}>
                      {pending.length} pending
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Gallery controls */}
            {status !== 'ended' && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleToggleOpen}
                  disabled={togglingOpen}
                  className="flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                  style={status === 'open'
                    ? { backgroundColor: 'rgba(254,242,242,0.15)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.4)' }
                    : { backgroundColor: 'rgba(240,253,244,0.15)', color: '#86efac', border: '1px solid rgba(134,239,172,0.4)' }
                  }
                >
                  {status === 'open' ? 'Pause' : 'Resume'}
                </button>

                {!confirmEnd ? (
                  <button
                    onClick={() => setConfirmEnd(true)}
                    className="flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-xl transition-all"
                    style={{ backgroundColor: 'rgba(246,235,221,0.12)', color: 'rgba(246,235,221,0.65)', border: '1px solid rgba(246,235,221,0.2)' }}
                  >
                    End event
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleEndEvent}
                      disabled={ending}
                      className="px-3 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 transition-all"
                      style={{ backgroundColor: 'rgba(254,242,242,0.2)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.4)' }}
                    >
                      {ending ? 'Ending…' : 'Yes, end'}
                    </button>
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="px-3 py-2 text-xs rounded-xl transition-all"
                      style={{ backgroundColor: 'rgba(246,235,221,0.1)', color: 'rgba(246,235,221,0.55)', border: '1px solid rgba(246,235,221,0.15)' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl">

          {/* Post-event summary */}
          {status === 'ended' && summary && (
            <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(246,235,221,0.15)', backgroundColor: 'rgba(246,235,221,0.04)' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(246,235,221,0.1)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(246,235,221,0.4)' }}>Event summary</p>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {/* Stat tiles */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total submitted', value: summary.totalSubmissions },
                    { label: 'Approved', value: summary.approvedCount },
                    { label: 'Unique guests', value: summary.uniqueGuests },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl px-3 py-3 text-center" style={{ backgroundColor: 'rgba(246,235,221,0.06)', border: '1px solid rgba(246,235,221,0.1)' }}>
                      <p className="text-2xl font-bold" style={{ color: '#F6EBDD' }}>{value}</p>
                      <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: 'rgba(246,235,221,0.4)' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Most-loved moment */}
                {summary.topSubmission && summary.topSubmission.totalReactions > 0 && (
                  <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {summary.topSubmission.featuredPhotoUrl && (
                      <img
                        src={summary.topSubmission.featuredPhotoUrl.startsWith('http') ? summary.topSubmission.featuredPhotoUrl : `${API_BASE}${summary.topSubmission.featuredPhotoUrl}`}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>Most loved</p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#F6EBDD' }}>{summary.topSubmission.guestName}</p>
                      {summary.topSubmission.message && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(246,235,221,0.5)' }}>"{summary.topSubmission.message}"</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>{summary.topSubmission.totalReactions}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(245,158,11,0.6)' }}>reactions</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export + share banner */}
          {status === 'ended' && (
            <div className="mb-8 flex flex-col gap-3">
              {/* Download */}
              <div
                className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ backgroundColor: '#fef9f0', border: '1px solid #e8c97a' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#7c5c1e' }}>Download your Glimpses</p>
                  {exportExpired ? (
                    <p className="text-xs mt-0.5" style={{ color: '#a08040' }}>Export window has expired · photos will be removed shortly</p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: '#a08040' }}>
                      ZIP of all approved photos · {exportWindowDays} day{exportWindowDays !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  {downloadError && <p className="text-xs mt-1 text-red-500">{downloadError}</p>}
                </div>
                {!exportExpired && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#B85C37', color: '#F6EBDD', border: '1px solid #9e4e2f' }}
                  >
                    {downloading ? 'Preparing…' : 'Download ZIP'}
                  </button>
                )}
              </div>

              {/* Share final gallery */}
              {!exportExpired && (
                <div
                  className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                  style={{ backgroundColor: '#f5f0fa', border: '1px solid #d4bdf5' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#5b3a8a' }}>Share the final gallery</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8a6ab0' }}>
                      A read-only photo gallery your guests can revisit
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/g/${gallery.id}/gallery`;
                      navigator.clipboard.writeText(url).then(() => {
                        setGalleryCopied(true);
                        setTimeout(() => setGalleryCopied(false), 2000);
                      });
                    }}
                    className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                    style={{ backgroundColor: '#7c3aed', color: '#fff', border: '1px solid #6d28d9' }}
                  >
                    {galleryCopied ? '✓ Copied!' : 'Copy link'}
                  </button>
                </div>
              )}
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-4xl mb-3 opacity-30">📸</div>
              <p className="text-sm font-medium" style={{ color: '#a08060' }}>No submissions yet</p>
              <p className="text-xs mt-1" style={{ color: '#c0a070' }}>Share the QR code with guests to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">

              {/* ── Pending ── */}
              {pending.length > 0 && (
                <section>
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-2xl mb-4"
                    style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b' }}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#92400e' }}>
                        Pending Review
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#b45309' }}>
                        {pending.length} waiting for your approval
                      </p>
                    </div>
                    {pending.length > 1 && (
                      <button
                        onClick={handleBulkApprove}
                        disabled={bulkApproving}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        style={{ backgroundColor: '#B85C37', color: '#F6EBDD', border: '1px solid #9e4e2f' }}
                      >
                        {bulkApproving ? 'Approving…' : `Approve all ${pending.length}`}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                    {pending.map(sub => (
                      <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} onDelete={handleDelete} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Live ── */}
              {approved.length > 0 && (
                <section>
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-2xl mb-4"
                    style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '3px solid #22c55e' }}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#14532d' }}>
                        Live on Feed
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#166534' }}>
                        {approved.length} photo{approved.length !== 1 ? 's' : ''} visible to guests
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                    {approved.map(sub => (
                      <SubmissionCard key={sub.id} sub={sub} onToggle={handleToggleApprove} onDelete={handleDelete} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
