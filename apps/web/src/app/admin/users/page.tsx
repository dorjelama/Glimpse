'use client';

import { useEffect, useState } from 'react';
import { api, AdminUser } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

export default function AdminUsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.listAdminUsers()
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setLoading(id);
    try {
      await api.deleteAdminUser(id);
      setUsers((prev) => prev?.filter((u) => u.id !== id) ?? null);
      setConfirmDelete(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setLoading(user.id);
    try {
      const updated = await api.setAdminUserRole(user.id, newRole);
      setUsers((prev) => prev?.map((u) => u.id === updated.id ? updated : u) ?? null);
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
          Users
          {users !== null && (
            <span className="ml-2 text-base font-normal" style={{ color: '#a08060' }}>({users.length})</span>
          )}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#a08060' }}>Manage registered accounts</p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#fff8f0', border: '1px solid #e8d5b0' }}
      >
        {!users ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-5 text-sm" style={{ color: '#a08060' }}>No users.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8d5b0' }}>
                {['Name', 'Email', 'Role', 'Events', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b09060' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    style={{ borderBottom: i < users.length - 1 ? '1px solid #f0e4cc' : 'none' }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: '#2d1a00' }}>{u.name}</td>
                    <td className="px-5 py-3" style={{ color: '#8a6040' }}>{u.email}</td>
                    <td className="px-5 py-3">
                      {u.role === 'ADMIN' ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(184,92,55,0.12)', color: '#B85C37', border: '1px solid rgba(184,92,55,0.25)' }}
                        >
                          Admin
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(160,128,96,0.1)', color: '#a08060', border: '1px solid #e8d5b0' }}
                        >
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#8a6040' }}>{u._count.events}</td>
                    <td className="px-5 py-3" style={{ color: '#b09060' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isSelf || loading === u.id}
                          title={isSelf ? "Can't change your own role" : undefined}
                          className="px-2.5 py-1 text-xs rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'rgba(184,92,55,0.1)', color: '#B85C37', border: '1px solid rgba(184,92,55,0.2)' }}
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={isSelf || loading === u.id}
                          title={isSelf ? "Can't delete your own account here" : undefined}
                          className="px-2.5 py-1 text-xs rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={confirmDelete === u.id
                            ? { backgroundColor: '#ef4444', color: '#fff', border: '1px solid #dc2626' }
                            : { backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                          }
                        >
                          {confirmDelete === u.id ? 'Confirm?' : 'Delete'}
                        </button>
                        {confirmDelete === u.id && (
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
