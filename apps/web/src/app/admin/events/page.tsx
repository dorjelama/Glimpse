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

  if (error) return <div className="p-8 text-sm" style={{ color: '#b05030' }}>Error: {error}</div>;

  return (
    <div className="px-6 py-8 md:px-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2d1a00' }}>
          Events
          {events !== null && (
            <span className="ml-2 text-base font-normal" style={{ color: '#a08060' }}>({events.length})</span>
          )}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#a08060' }}>All events across the platform</p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
      >
        {!events ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>No events.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8d5b0' }}>
                {['Title', 'Owner', 'Status', 'Updated', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b09060' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={ev.id}
                  style={{ borderBottom: i < events.length - 1 ? '1px solid #f0e4cc' : 'none' }}
                >
                  <td className="px-5 py-3 font-medium max-w-[200px] truncate" style={{ color: '#2d1a00' }}>
                    {ev.title}
                  </td>
                  <td className="px-5 py-3">
                    {ev.owner ? (
                      <span style={{ color: '#8a6040' }}>
                        {ev.owner.name}{' '}
                        <span className="text-xs" style={{ color: '#b09060' }}>({ev.owner.email})</span>
                      </span>
                    ) : (
                      <span className="italic" style={{ color: '#c0a070' }}>No owner</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {ev.status === 'published' ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}
                      >
                        Published
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: 'rgba(160,128,96,0.1)', color: '#a08060', border: '1px solid #e8d5b0' }}
                      >
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3" style={{ color: '#b09060' }}>
                    {new Date(ev.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {ev.status === 'published' && ev.slug && (
                        <a
                          href={`${BASE_URL}/view/${ev.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs rounded-lg transition-all"
                          style={{ backgroundColor: 'rgba(184,92,55,0.1)', color: '#B85C37', border: '1px solid rgba(184,92,55,0.2)' }}
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(ev.id)}
                        disabled={loading === ev.id}
                        className="px-2.5 py-1 text-xs rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={confirmDelete === ev.id
                          ? { backgroundColor: '#ef4444', color: '#fff', border: '1px solid #dc2626' }
                          : { backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                        }
                      >
                        {confirmDelete === ev.id ? 'Confirm?' : 'Delete'}
                      </button>
                      {confirmDelete === ev.id && (
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs transition-all"
                          style={{ color: '#b09060' }}
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
