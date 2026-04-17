'use client';

import { useEffect, useState } from 'react';
import { api, AdminEvent } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.listAdminEvents()
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setLoading(id);
    try {
      await api.deleteAdminEvent(id);
      setEvents((prev) => prev?.filter((e) => e.id !== id) ?? null);
      setConfirmDelete(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-6">
        Events {events !== null && <span className="text-gray-500 font-normal text-base">({events.length})</span>}
      </h1>

      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        {!events ? (
          <div className="p-5 text-sm text-gray-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No events.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-2">Title</th>
                <th className="px-5 py-2">Owner</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">Updated</th>
                <th className="px-5 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-white max-w-[200px] truncate">{ev.title}</td>
                  <td className="px-5 py-3">
                    {ev.owner ? (
                      <span className="text-gray-400">{ev.owner.name} <span className="text-gray-600 text-xs">({ev.owner.email})</span></span>
                    ) : (
                      <span className="text-gray-600 italic">No owner</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {ev.status === 'published' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 uppercase tracking-wider">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-400 uppercase tracking-wider">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(ev.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {ev.status === 'published' && ev.slug && (
                        <a
                          href={`${BASE_URL}/view/${ev.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(ev.id)}
                        disabled={loading === ev.id}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          confirmDelete === ev.id
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'
                        }`}
                      >
                        {confirmDelete === ev.id ? 'Confirm?' : 'Delete'}
                      </button>
                      {confirmDelete === ev.id && (
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
