'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { api, type GlimpseProject } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function CardFeatureTile({ project }: { project: GlimpseProject }) {
  const router = useRouter();
  const card = project.events[0];

  if (!card) {
    return (
      <div className="bg-blush border border-gold/30 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="text-ink font-semibold text-sm">Card</p>
            <p className="text-ink/40 text-xs">No card attached</p>
          </div>
        </div>
        <p className="text-ink/60 text-sm leading-relaxed">Design a beautiful card for this event — invitation, announcement, or anything you like.</p>
        <button
          onClick={async () => {
            const event = await api.createEvent({ title: project.title });
            router.push(`/editor/${event.id}`);
          }}
          className="self-start px-4 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + Create Card
        </button>
      </div>
    );
  }

  const firstPage = card.pages[0];

  return (
    <div className="bg-cream border border-gold/30 rounded-2xl overflow-hidden flex flex-col">
      {/* Preview */}
      <div
        className="h-40 flex items-center justify-center border-b border-gold/20"
        style={{ backgroundColor: firstPage?.bgColor || '#F9CDB5' }}
      >
        {firstPage?.bgImage ? (
          <img src={firstPage.bgImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-20 select-none text-ink">📄</span>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-ink font-semibold text-sm">Card</p>
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${
              card.status === 'published'
                ? 'bg-green-100 text-green-700'
                : 'bg-blush text-terra border border-terra/20'
            }`}>
              {card.status}
            </span>
          </div>
          {card.status === 'published' && card.slug && (
            <button
              onClick={() => window.open(`/view/${card.slug}`, '_blank')}
              className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              View Live →
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => router.push(`/editor/${card.id}`)}
            className="flex-1 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors text-center"
          >
            Edit Card
          </button>
          <button
            onClick={() => router.push(`/preview/${card.id}`)}
            className="px-4 py-2 bg-blush hover:bg-gold/20 text-ink text-sm rounded-xl transition-colors border border-gold/30"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function GlimpsesFeatureTile({ project }: { project: GlimpseProject }) {
  const router = useRouter();
  const [setting, setSetting] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project.gallery) return;
    api.listSubmissions(project.gallery.id)
      .then(subs => setPendingCount(subs.filter(s => !s.approved).length))
      .catch(() => {});
  }, [project.gallery?.id]);

  const handleSetup = async () => {
    setSetting(true);
    try {
      await api.createGallery(project.id);
      window.location.reload();
    } finally {
      setSetting(false);
    }
  };

  const handleDownloadPNG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const padding = 32;
    const qrSize = 400;
    const size = qrSize + padding * 2;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${project.title}-glimpses-qr.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = svgUrl;
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore — clipboard may be blocked */ }
  };

  if (project.gallery) {
    const uploadUrl = `${window.location.origin}/g/${project.gallery.id}/feed`;

    return (
      <div className="bg-cream border border-gold/30 rounded-2xl overflow-hidden flex flex-col">
        {/* QR preview */}
        <div className="h-40 flex items-center justify-center border-b border-gold/20 bg-white p-4" ref={qrRef}>
          <QRCode value={uploadUrl} size={120} />
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-ink font-semibold text-sm">Glimpses</p>
                {pendingCount != null && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors ${
                      pendingCount > 0
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-blush text-ink/30 border-gold/20'
                    }`}
                    title={pendingCount > 0 ? `${pendingCount} pending approval` : 'No pending submissions'}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${
                project.gallery.isOpen
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blush text-ink/50 border border-gold/20'
              }`}>
                {project.gallery.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <p className="text-ink/40 text-xs font-mono break-all select-all">{uploadUrl}</p>

          <p className="text-ink/30 text-[11px]">
            Print for tables · Share in group chat · Project on screen
          </p>

          <div className="flex flex-wrap gap-2 mt-auto">
            <button
              onClick={handleDownloadPNG}
              className="px-3 py-2 bg-gold/20 hover:bg-gold/30 text-ink/70 text-sm font-medium rounded-xl transition-colors border border-gold/30"
            >
              ↓ PNG
            </button>
            <button
              onClick={() => handleCopyLink(uploadUrl)}
              className="px-3 py-2 bg-gold/20 hover:bg-gold/30 text-ink/70 text-sm font-medium rounded-xl transition-colors border border-gold/30 min-w-[90px]"
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => router.push(`/events/${project.id}/glimpses`)}
              className="flex-1 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors text-center"
            >
              Moderate
            </button>
            <button
              onClick={() => window.open(`/g/${project.gallery!.id}/feed`, '_blank')}
              className="px-3 py-2 bg-blush hover:bg-gold/20 text-ink text-sm font-medium rounded-xl transition-colors border border-gold/30"
              title="Open live feed"
            >
              Feed →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blush/50 border border-dashed border-gold/40 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📸</span>
        <div>
          <p className="text-ink font-semibold text-sm">Glimpses</p>
          <p className="text-ink/40 text-xs">Not set up</p>
        </div>
      </div>
      <p className="text-ink/60 text-sm leading-relaxed">
        Share a QR code so guests can upload live photos from your event. You curate what appears on the live feed.
      </p>
      <button
        onClick={handleSetup}
        disabled={setting}
        className="self-start px-4 py-2 bg-terra/10 hover:bg-terra/20 disabled:opacity-50 text-terra text-sm font-semibold rounded-xl transition-colors border border-terra/30"
      >
        {setting ? 'Setting up…' : '+ Set up Glimpses'}
      </button>
    </div>
  );
}

export default function EventHubPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<GlimpseProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    api.getProject(params.id)
      .then(setProject)
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleTitleSave = async () => {
    if (!project || !titleDraft.trim() || titleDraft === project.title) {
      setEditingTitle(false);
      return;
    }
    const updated = await api.updateProject(project.id, { title: titleDraft.trim() });
    setProject(updated);
    setEditingTitle(false);
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

  if (!project) return null;

  return (
    <DashboardShell>
      <div className="min-h-full bg-cream px-4 py-6 md:px-8 md:py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-ink/40 hover:text-ink mb-3 block transition-colors"
          >
            ← All events
          </button>

          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }}
              className="text-2xl font-bold text-ink bg-blush rounded-xl px-3 py-1 border border-terra focus:outline-none w-full max-w-sm"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }}
              className="text-2xl font-bold text-ink hover:text-terra transition-colors text-left"
              style={{ fontFamily: 'Georgia, serif' }}
              title="Click to rename"
            >
              {project.title}
            </button>
          )}
          {project.date && (
            <p className="text-sm text-ink/40 mt-1">{formatDate(project.date)}</p>
          )}
        </div>

        {/* Feature grid */}
        <div>
          <p className="text-xs font-semibold text-ink/30 uppercase tracking-widest mb-4">Features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardFeatureTile project={project} />
            <GlimpsesFeatureTile project={project} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
