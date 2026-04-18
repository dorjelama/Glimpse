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
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="text-white font-semibold text-sm">Card</p>
            <p className="text-gray-500 text-xs">No card attached</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Design a beautiful card for this event — invitation, announcement, or anything you like.</p>
        <button
          onClick={async () => {
            const event = await api.createEvent({ title: project.title });
            router.push(`/editor/${event.id}`);
          }}
          className="self-start px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
        >
          + Create Card
        </button>
      </div>
    );
  }

  const firstPage = card.pages[0];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      {/* Preview */}
      <div
        className="h-40 flex items-center justify-center border-b border-white/10"
        style={{ backgroundColor: firstPage?.bgColor || '#1e1830' }}
      >
        {firstPage?.bgImage ? (
          <img src={firstPage.bgImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-10 select-none">📄</span>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Card</p>
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${
              card.status === 'published'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-gray-400'
            }`}>
              {card.status}
            </span>
          </div>
          {card.status === 'published' && card.slug && (
            <button
              onClick={() => window.open(`/view/${card.slug}`, '_blank')}
              className="text-xs px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
            >
              View Live →
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => router.push(`/editor/${card.id}`)}
            className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors text-center"
          >
            Edit Card
          </button>
          <button
            onClick={() => router.push(`/preview/${card.id}`)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-colors"
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

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}-glimpses-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (project.gallery) {
    const uploadUrl = `${window.location.origin}/g/${project.gallery.id}`;

    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {/* QR preview */}
        <div className="h-40 flex items-center justify-center border-b border-white/10 bg-white p-4" ref={qrRef}>
          <QRCode value={uploadUrl} size={120} />
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm">Glimpses</p>
                {pendingCount != null && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors ${
                      pendingCount > 0
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-white/5 text-gray-500 border-white/10'
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
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {project.gallery.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-xs font-mono break-all select-all">{uploadUrl}</p>

          <div className="flex gap-2 mt-auto">
            <button
              onClick={handleDownloadQR}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-xl transition-colors border border-amber-500/30 text-center"
            >
              Download QR
            </button>
            <button
              onClick={() => router.push(`/events/${project.id}/glimpses`)}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors text-center"
            >
              Moderate
            </button>
            <button
              onClick={() => window.open(`/g/${project.gallery!.id}/feed`, '_blank')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
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
    <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📸</span>
        <div>
          <p className="text-white font-semibold text-sm">Moments</p>
          <p className="text-gray-500 text-xs">Not set up</p>
        </div>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        Share a QR code so guests can upload live photos from your event. You curate what appears on the live feed.
      </p>
      <button
        onClick={handleSetup}
        disabled={setting}
        className="self-start px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-400 text-sm font-medium rounded-xl transition-colors border border-amber-500/30"
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
      .catch(() => router.push('/'))
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
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!project) return null;

  return (
    <DashboardShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }}
              className="text-2xl font-bold text-white bg-white/5 rounded-xl px-3 py-1 border border-accent focus:outline-none w-full max-w-sm"
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(project.title); setEditingTitle(true); }}
              className="text-2xl font-bold text-white hover:text-purple-300 transition-colors text-left"
              title="Click to rename"
            >
              {project.title}
            </button>
          )}
          {project.date && (
            <p className="text-sm text-purple-300/60 mt-1">{formatDate(project.date)}</p>
          )}
        </div>

        {/* Feature grid */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardFeatureTile project={project} />
            <GlimpsesFeatureTile project={project} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
