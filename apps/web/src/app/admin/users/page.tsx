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

  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-6">
        Users {users !== null && <span className="text-gray-500 font-normal text-base">({users.length})</span>}
      </h1>

      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        {!users ? (
          <div className="p-5 text-sm text-gray-500">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">No users.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Email</th>
                <th className="px-5 py-2">Role</th>
                <th className="px-5 py-2">Events</th>
                <th className="px-5 py-2">Joined</th>
                <th className="px-5 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white">{u.name}</td>
                    <td className="px-5 py-3 text-gray-400">{u.email}</td>
                    <td className="px-5 py-3">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 uppercase tracking-wider">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-400 uppercase tracking-wider">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400">{u._count.events}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isSelf || loading === u.id}
                          title={isSelf ? "Can't change your own role" : undefined}
                          className="px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={isSelf || loading === u.id}
                          title={isSelf ? "Can't delete your own account here" : undefined}
                          className={`px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            confirmDelete === u.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'
                          }`}
                        >
                          {confirmDelete === u.id ? 'Confirm?' : 'Delete'}
                        </button>
                        {confirmDelete === u.id && (
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
