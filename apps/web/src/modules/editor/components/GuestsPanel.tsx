'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { api, type Guest } from '@/lib/api';

export default function GuestsPanel() {
  const project = useEditorStore((s) => s.project);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadGuests = useCallback(async () => {
    if (!project) return;
    try {
      const list = await api.listGuests(project.id);
      setGuests(list);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  const handleAdd = async () => {
    if (!project || !nameInput.trim()) return;
    setAdding(true);
    try {
      const guest = await api.addGuest(project.id, {
        name: nameInput.trim(),
        email: emailInput.trim() || undefined,
      });
      setGuests((prev) => [...prev, guest]);
      setNameInput('');
      setEmailInput('');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!project) return;
    await api.deleteGuest(project.id, guest.id);
    setGuests((prev) => prev.filter((g) => g.id !== guest.id));
  };

  const getLink = (guest: Guest) => {
    if (!project?.slug) return null;
    return `${window.location.origin}/view/${project.slug}?g=${guest.token}`;
  };

  const copyLink = (guest: Guest) => {
    const link = getLink(guest);
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(guest.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const isPublished = project?.status === 'published' && !!project?.slug;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Add form */}
      <div className="p-3 border-b border-white/10 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Guest name *"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent placeholder:text-gray-500"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent placeholder:text-gray-500"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !nameInput.trim()}
          className="w-full py-1.5 text-xs bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-md transition-colors font-medium"
        >
          {adding ? 'Adding…' : '+ Add Guest'}
        </button>
      </div>

      {/* Not published warning */}
      {!isPublished && (
        <div className="mx-3 mt-3 px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[10px] text-yellow-400 leading-relaxed">
          Publish the invitation to generate shareable guest links.
        </div>
      )}

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-[11px] text-gray-500 text-center py-4">Loading…</p>
        ) : guests.length === 0 ? (
          <p className="text-[11px] text-gray-500 text-center py-4">No guests yet.</p>
        ) : (
          guests.map((guest) => (
            <div
              key={guest.id}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-white font-medium truncate">{guest.name}</span>
                <button
                  onClick={() => handleDelete(guest)}
                  className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove guest"
                >
                  ✕
                </button>
              </div>
              {guest.email && (
                <span className="text-[10px] text-gray-500 truncate">{guest.email}</span>
              )}
              {isPublished && (
                <button
                  onClick={() => copyLink(guest)}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors text-left ${
                    copied === guest.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 hover:bg-accent/30 text-gray-400 hover:text-purple-300'
                  }`}
                >
                  {copied === guest.id ? '✓ Copied!' : '🔗 Copy link'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
