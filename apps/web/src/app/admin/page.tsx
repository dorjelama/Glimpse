'use client';

import { useEffect, useState } from 'react';
import { api, AdminStats } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm" style={{ color: '#b05030' }}>Failed to load stats: {error}</p>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Users',  value: stats.totalUsers,      icon: '◎', accent: '#B85C37' },
    { label: 'Total Events', value: stats.totalEvents,     icon: '◇', accent: '#9e4e2f' },
    { label: 'Published',    value: stats.publishedEvents, icon: '✦', accent: '#16a34a' },
    { label: 'Drafts',       value: stats.draftEvents,     icon: '◈', accent: '#b09060' },
  ] : [];

  return (
    <div className="px-6 py-8 md:px-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2d1a00' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#a08060' }}>Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {!stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-pulse"
                style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
              >
                <div className="h-3 rounded w-2/3 mb-3" style={{ backgroundColor: '#e8d5b0' }} />
                <div className="h-8 rounded w-1/2" style={{ backgroundColor: '#e8d5b0' }} />
              </div>
            ))
          : statCards.map(({ label, value, icon, accent }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base" style={{ color: accent }}>{icon}</span>
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#a08060' }}>{label}</p>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#2d1a00' }}>{value}</p>
              </div>
            ))}
      </div>

      {/* Recent signups */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e8d5b0' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#5c3d1e' }}>Recent Signups</h2>
        </div>
        {!stats ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>Loading…</div>
        ) : stats.recentUsers.length === 0 ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8d5b0' }}>
                <th className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b09060' }}>Name</th>
                <th className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b09060' }}>Email</th>
                <th className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b09060' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < stats.recentUsers.length - 1 ? '1px solid #f0e4cc' : 'none' }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: '#2d1a00' }}>{u.name}</td>
                  <td className="px-5 py-3" style={{ color: '#8a6040' }}>{u.email}</td>
                  <td className="px-5 py-3" style={{ color: '#b09060' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
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
