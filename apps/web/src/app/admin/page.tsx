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
      <div className="p-8 text-red-400">Failed to load stats: {error}</div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Users',    value: stats.totalUsers },
    { label: 'Total Events',   value: stats.totalEvents },
    { label: 'Published',      value: stats.publishedEvents },
    { label: 'Drafts',         value: stats.draftEvents },
  ] : [];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {!stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-white/10 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-2/3 mb-3" />
                <div className="h-8 bg-white/10 rounded w-1/2" />
              </div>
            ))
          : statCards.map(({ label, value }) => (
              <div key={label} className="bg-neutral-900 border border-white/10 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
      </div>

      {/* Recent signups */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-medium text-gray-300">Recent Signups</h2>
        </div>
        {!stats ? (
          <div className="p-5 text-sm text-gray-500">Loading…</div>
        ) : stats.recentUsers.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Email</th>
                <th className="px-5 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3 text-gray-500">
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
