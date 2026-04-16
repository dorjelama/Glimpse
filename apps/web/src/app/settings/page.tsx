'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { useStatusStore } from '@/lib/statusStore';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-panel border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, deleteAccount, logout } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useStatusStore();

  // Name form
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateUser({ name });
      toastSuccess('Name updated');
    } catch (err: any) {
      toastError(err.message ?? 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await updateUser({ currentPassword, newPassword });
      toastSuccess('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.message ?? 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      router.push('/auth/login');
    } catch (err: any) {
      toastError(err.message ?? 'Failed to delete account');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-[#1a1230] to-indigo-950">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Update Name */}
        <Card title="Profile">
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Display name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full bg-white/5 text-gray-500 text-sm rounded-lg px-3 py-2.5 border border-white/10 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={savingName}
              className="self-start px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Change Password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Current password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent placeholder-gray-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent placeholder-gray-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Confirm new password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent placeholder-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="self-start px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {savingPassword ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card title="Danger Zone">
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete your account and all your invitations. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-60 ${
              deleteConfirm
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
            }`}
          >
            {deleting ? 'Deleting…' : deleteConfirm ? 'Yes, delete my account' : 'Delete account'}
          </button>
          {deleteConfirm && !deleting && (
            <button
              onClick={() => setDeleteConfirm(false)}
              className="ml-3 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
        </Card>
      </main>
    </div>
  );
}
