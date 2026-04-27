'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Guest, type GlimpseProject } from '@/lib/api';
import DashboardShell from '@/components/DashboardShell';

interface EditState {
  guestId: string;
  field: 'name' | 'email';
  value: string;
}

export default function GuestsPageClient({ projectId }: { projectId: string }) {
  const router = useRouter();

  const [project, setProject] = useState<GlimpseProject | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);
      const cardId = proj.events[0]?.id;
      if (cardId) {
        const gs = await api.listGuests(cardId);
        setGuests(gs);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const card = project?.events[0] ?? null;
  const isPublished = card?.status === 'published' && !!card?.slug;

  const getLink = (guest: Guest) => {
    if (!card?.slug) return null;
    return `${window.location.origin}/view/${card.slug}?g=${guest.token}`;
  };

  const handleAdd = async () => {
    if (!card || !nameInput.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const guest = await api.addGuest(card.id, {
        name: nameInput.trim(),
        email: emailInput.trim() || undefined,
      });
      setGuests((prev) => [...prev, guest]);
      setNameInput('');
      setEmailInput('');
    } catch (e: any) {
      setAddError(e.message ?? 'Failed to add guest.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!card) return;
    await api.deleteGuest(card.id, guest.id);
    setGuests((prev) => prev.filter((g) => g.id !== guest.id));
  };

  const startEdit = (guestId: string, field: 'name' | 'email', current: string) => {
    setEdit({ guestId, field, value: current });
  };

  const commitEdit = async () => {
    if (!edit || !card) return;
    const guest = guests.find((g) => g.id === edit.guestId);
    if (!guest) { setEdit(null); return; }

    const unchanged =
      (edit.field === 'name' && edit.value === guest.name) ||
      (edit.field === 'email' && edit.value === (guest.email ?? ''));

    if (unchanged || (edit.field === 'name' && !edit.value.trim())) {
      setEdit(null);
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateGuest(card.id, edit.guestId, {
        [edit.field]: edit.value.trim() || undefined,
      });
      setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } finally {
      setSaving(false);
      setEdit(null);
    }
  };

  const copyLink = (guest: Guest) => {
    const link = getLink(guest);
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(guest.id);
      setTimeout(() => setCopied(null), 2000);
    });
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

  return (
    <DashboardShell>
      <div className="min-h-full bg-cream px-4 py-6 md:px-8 md:py-8 max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/events/${projectId}`)}
            className="text-xs text-ink/40 hover:text-ink mb-3 block transition-colors"
          >
            ← Back to event
          </button>
          <h1
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Guests
          </h1>
          {project && (
            <p className="text-sm text-ink/40 mt-1">{project.title}</p>
          )}
        </div>

        {!card && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Create a card first before managing guests.
          </div>
        )}

        {card && (
          <>
            {/* Unpublished warning */}
            {!isPublished && (
              <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 leading-relaxed">
                Publish the card first to generate shareable guest links.
              </div>
            )}

            {/* Add guest form */}
            <div className="bg-white border border-gold/30 rounded-2xl p-5 mb-6">
              <p className="text-sm font-semibold text-ink mb-3">Add a guest</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Name *"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1 border border-gold/30 rounded-xl px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:border-terra placeholder:text-ink/30"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1 border border-gold/30 rounded-xl px-3 py-2 text-sm text-ink bg-cream focus:outline-none focus:border-terra placeholder:text-ink/30"
                />
                <button
                  onClick={handleAdd}
                  disabled={adding || !nameInput.trim()}
                  className="px-5 py-2 bg-terra hover:bg-terra/90 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  {adding ? 'Adding…' : 'Add Guest'}
                </button>
              </div>
              {addError && (
                <p className="mt-2 text-xs text-red-500">{addError}</p>
              )}
            </div>

            {/* Guest list */}
            {guests.length === 0 ? (
              <div className="text-center py-16 text-ink/30 text-sm">
                No guests yet. Add your first guest above.
              </div>
            ) : (
              <div className="bg-white border border-gold/30 rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gold/20 bg-blush/40">
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Name</span>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Email</span>
                  <span className="text-xs font-semibold text-ink/50 uppercase tracking-wider">Actions</span>
                </div>

                {/* Rows */}
                {guests.map((guest, idx) => (
                  <div
                    key={guest.id}
                    className={`grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-5 py-3 ${
                      idx < guests.length - 1 ? 'border-b border-gold/20' : ''
                    }`}
                  >
                    {/* Name cell */}
                    <div>
                      {edit?.guestId === guest.id && edit.field === 'name' ? (
                        <input
                          autoFocus
                          value={edit.value}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') setEdit(null);
                          }}
                          className="w-full border border-terra rounded-lg px-2 py-1 text-sm text-ink bg-blush/40 focus:outline-none"
                          disabled={saving}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(guest.id, 'name', guest.name)}
                          className="text-sm text-ink font-medium hover:text-terra transition-colors text-left w-full truncate"
                          title="Click to edit"
                        >
                          {guest.name}
                        </button>
                      )}
                    </div>

                    {/* Email cell */}
                    <div>
                      {edit?.guestId === guest.id && edit.field === 'email' ? (
                        <input
                          autoFocus
                          type="email"
                          value={edit.value}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') setEdit(null);
                          }}
                          className="w-full border border-terra rounded-lg px-2 py-1 text-sm text-ink bg-blush/40 focus:outline-none"
                          disabled={saving}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(guest.id, 'email', guest.email ?? '')}
                          className="text-sm text-ink/50 hover:text-terra transition-colors text-left w-full truncate"
                          title="Click to edit"
                        >
                          {guest.email || <span className="text-ink/20">—</span>}
                        </button>
                      )}
                    </div>

                    {/* Actions cell */}
                    <div className="flex items-center gap-2">
                      {isPublished ? (
                        <button
                          onClick={() => copyLink(guest)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
                            copied === guest.id
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blush hover:bg-gold/20 text-terra border border-gold/30'
                          }`}
                        >
                          {copied === guest.id ? '✓ Copied' : 'Copy link'}
                        </button>
                      ) : (
                        <span
                          className="text-xs px-3 py-1.5 rounded-lg bg-blush/40 text-ink/20 border border-gold/20 cursor-not-allowed whitespace-nowrap"
                          title="Publish the card to enable guest links"
                        >
                          Copy link
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(guest)}
                        className="text-ink/30 hover:text-red-500 transition-colors text-base leading-none px-1"
                        title="Remove guest"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {/* Footer count */}
                <div className="px-5 py-3 border-t border-gold/20 bg-blush/20">
                  <p className="text-xs text-ink/30">
                    {guests.length} guest{guests.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
