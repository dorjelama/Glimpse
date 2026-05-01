'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { useStatusStore } from '@/lib/statusStore';
import DashboardShell from '@/components/DashboardShell';
import Breadcrumbs from '@/components/Breadcrumbs';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gold/30 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gold/20">
        <h2 className="text-xs font-semibold text-ink/40 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const inputClass = 'w-full bg-cream border border-gold/40 text-ink text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-terra/60 placeholder:text-ink/30 transition-colors';
const inputDisabledClass = 'w-full bg-blush/40 border border-gold/20 text-ink/30 text-sm rounded-xl px-4 py-2.5 cursor-not-allowed';
const labelClass = 'text-xs font-medium text-ink/50';
const primaryBtn = 'self-start px-4 py-2 bg-terra hover:bg-terra/90 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, deleteAccount, logout } = useAuthStore();
  const { success: toastSuccess, error: toastError } = useStatusStore();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
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
    <DashboardShell>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-xl">

        <div className="mb-8">
          <Breadcrumbs crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]} />
          <h1 className="text-2xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>Settings</h1>
          <p className="text-sm text-ink/40 mt-1">Manage your account and preferences.</p>
        </div>

        <div className="flex flex-col gap-6">

          {/* Profile */}
          <Section title="Profile">
            <form onSubmit={handleSaveName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Display name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className={inputDisabledClass}
                />
              </div>
              <button type="submit" disabled={savingName} className={primaryBtn}>
                {savingName ? 'Saving…' : 'Save name'}
              </button>
            </form>
          </Section>

          {/* Change Password */}
          <Section title="Change Password">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Current password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={savingPassword} className={primaryBtn}>
                {savingPassword ? 'Saving…' : 'Change password'}
              </button>
            </form>
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone">
            <p className="text-sm text-ink/50 mb-4 leading-relaxed">
              Permanently delete your account and all your cards. This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                  deleteConfirm
                    ? 'bg-red-600 hover:bg-red-700 text-white font-semibold'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              >
                {deleting ? 'Deleting…' : deleteConfirm ? 'Yes, delete my account' : 'Delete account'}
              </button>
              {deleteConfirm && !deleting && (
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-sm text-ink/40 hover:text-ink transition-colors rounded-xl hover:bg-ink/5"
                >
                  Cancel
                </button>
              )}
            </div>
          </Section>

        </div>
      </div>
    </DashboardShell>
  );
}
