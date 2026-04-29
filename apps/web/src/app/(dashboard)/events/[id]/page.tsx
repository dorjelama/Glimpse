'use client';

import { useState, useEffect, useRef, useCallback, use, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import QRCodeLib from 'react-qr-code';
const QRCode = QRCodeLib as unknown as ComponentType<{ value: string; size?: number }>;
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

function ShareCardModal({
  card,
  galleryFeedUrl,
  onClose,
}: {
  card: { id: string; slug?: string };
  galleryFeedUrl?: string;
  onClose: () => void;
}) {
  const [emailsRaw, setEmailsRaw] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const emails = emailsRaw
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emails.length === 0) {
      setError('Enter at least one valid email address.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await api.shareCard(card.id, {
        emails,
        message: message.trim() || undefined,
        galleryFeedUrl,
      });
      setSent(result.sent);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-cream border border-gold/30 rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {sent !== null ? (
          /* Success state */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-ink font-semibold text-base">Invitations sent!</p>
              <p className="text-ink/50 text-sm mt-1">{sent} recipient{sent !== 1 ? 's' : ''} will receive the invitation by email.</p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-ink font-semibold text-base" style={{ fontFamily: 'Georgia, serif' }}>
                Share invitation
              </h2>
              <p className="text-ink/50 text-sm mt-1">
                Guests will receive an email with a link to view the card and the live photo feed.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink/60">
                Email addresses <span className="text-ink/30">(comma or line separated)</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                value={emailsRaw}
                onChange={e => setEmailsRaw(e.target.value)}
                placeholder="jane@example.com, john@example.com"
                className="w-full bg-blush text-ink text-sm rounded-xl px-4 py-3 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink/60">
                Personal message <span className="text-ink/30">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Can't wait to celebrate with you!"
                className="w-full bg-blush text-ink text-sm rounded-xl px-4 py-3 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-ink/40 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !emailsRaw.trim()}
                className="px-5 py-2 bg-terra hover:bg-terra/90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {sending ? 'Sending…' : 'Send invitations'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardFeatureTile({ project }: { project: GlimpseProject }) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
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
    <div className="bg-cream border border-gold/30 rounded-2xl overflow-hidden flex flex-col hover:border-terra/40 hover:shadow-md hover:shadow-terra/10 transition-all duration-200">
      {/* Preview */}
      <div
        className="h-52 flex items-center justify-center border-b border-gold/20"
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

        <div className="flex gap-2 mt-auto flex-wrap">
          <button
            onClick={() => router.push(`/editor/${card.id}`)}
            className="flex-1 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors text-center"
          >
            Edit Card
          </button>
          {card.status === 'published' && (
            <button
              onClick={() => setShowShare(true)}
              className="px-4 py-2 bg-blush hover:bg-gold/20 text-ink text-sm font-medium rounded-xl transition-colors border border-gold/30 flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Share
            </button>
          )}
          <button
            onClick={() => router.push(`/preview/${card.id}`)}
            className="px-4 py-2 bg-blush hover:bg-gold/20 text-ink text-sm rounded-xl transition-colors border border-gold/30"
          >
            Preview
          </button>
        </div>
      </div>

      {showShare && (
        <ShareCardModal
          card={card}
          galleryFeedUrl={project.gallery
            ? `${window.location.origin}/g/${project.gallery.id}/feed`
            : undefined}
          onClose={() => setShowShare(false)}
        />
      )}
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

  const handleDownloadPNG = (title: string, feedUrl: string) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const W = 560;
    const qrSize = 300;
    const qrPad = 28;
    const qrCardW = qrSize + qrPad * 2;
    const qrCardX = (W - qrCardW) / 2;
    const qrCardY = 130;
    const H = qrCardY + qrCardW + 110;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#B85C37';
    ctx.fillRect(0, 0, W, H);

    // Subtle top stripe
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, 0, W, 100);

    // "Glimpses" wordmark
    ctx.fillStyle = '#F6EBDD';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Glimpses', W / 2, 52);

    // Event title
    const maxTitleW = W - 80;
    ctx.font = '17px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(246,235,221,0.75)';
    let t = title;
    while (t.length > 0 && ctx.measureText(t).width > maxTitleW) t = t.slice(0, -1);
    if (t !== title) t += '…';
    ctx.fillText(t, W / 2, 80);

    // White QR card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const r = 16;
    ctx.roundRect(qrCardX, qrCardY, qrCardW, qrCardW, r);
    ctx.fill();

    // Draw QR SVG onto canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, qrCardX + qrPad, qrCardY + qrPad, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // CTA text
      ctx.fillStyle = 'rgba(246,235,221,0.9)';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('📸  Scan to share your moment', W / 2, qrCardY + qrCardW + 44);

      // URL
      ctx.fillStyle = 'rgba(246,235,221,0.45)';
      ctx.font = '11px monospace';
      ctx.fillText(feedUrl, W / 2, H - 22);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${title}-glimpses-qr.png`;
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
      <div className="bg-cream border border-gold/30 rounded-2xl overflow-hidden flex flex-col hover:border-terra/40 hover:shadow-md hover:shadow-terra/10 transition-all duration-200">
        {/* QR branded card — fixed h-52 to match Card tile preview height */}
        <div
          ref={qrRef}
          className="h-52 flex flex-col items-center justify-center gap-2 border-b border-[#9e4e2f]"
          style={{ background: 'linear-gradient(160deg, #c4663e 0%, #B85C37 60%, #9e4e2f 100%)' }}
        >
          <div className="text-center leading-tight">
            <p className="text-[#F6EBDD] font-bold text-sm tracking-tight">Glimpses</p>
            <p className="text-[10px] truncate max-w-[180px]" style={{ color: 'rgba(246,235,221,0.6)' }}>
              {project.title}
            </p>
          </div>
          <div className="bg-white rounded-xl p-2.5 shadow-md">
            <QRCode value={uploadUrl} size={88} />
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(246,235,221,0.65)' }}>
            📸 Scan to share your moment
          </p>
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
              onClick={() => handleDownloadPNG(project.title, uploadUrl)}
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

function GuestsFeatureTile({ project }: { project: GlimpseProject }) {
  const router = useRouter();
  const card = project.events[0];
  const [guestCount, setGuestCount] = useState<number | null>(null);

  useEffect(() => {
    if (!card) return;
    api.listGuests(card.id)
      .then((gs) => setGuestCount(gs.length))
      .catch(() => {});
  }, [card?.id]);

  return (
    <div className="bg-cream border border-gold/30 rounded-2xl overflow-hidden flex flex-col hover:border-terra/40 hover:shadow-md hover:shadow-terra/10 transition-all duration-200">
      {/* Header visual */}
      <div className="h-52 flex flex-col items-center justify-center gap-3 border-b border-gold/20 bg-blush/60">
        <div className="w-14 h-14 rounded-full bg-terra/10 border border-terra/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B85C37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        {guestCount !== null && (
          <p className="text-3xl font-bold text-terra" style={{ fontFamily: 'Georgia, serif' }}>
            {guestCount}
          </p>
        )}
        <p className="text-xs text-ink/40">
          {guestCount === null ? 'Guest list' : guestCount === 1 ? '1 guest' : `${guestCount} guests`}
        </p>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <p className="text-ink font-semibold text-sm">Guests</p>
          <p className="text-ink/40 text-xs mt-0.5">
            {card ? 'Manage personalised invite links for each guest.' : 'Create a card first to manage guests.'}
          </p>
        </div>
        <div className="mt-auto">
          {card ? (
            <button
              onClick={() => router.push(`/events/${project.id}/guests`)}
              className="w-full py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Manage Guests
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2 bg-terra/20 text-terra/40 text-sm font-semibold rounded-xl cursor-not-allowed"
            >
              Manage Guests
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<GlimpseProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    api.getProject(id)
      .then(setProject)
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

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
            <GuestsFeatureTile project={project} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
