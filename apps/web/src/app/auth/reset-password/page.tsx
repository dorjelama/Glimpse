'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setError('Missing reset token. Please use the link from your email.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-3xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: 'Georgia, serif' }}>Password updated!</h2>
        <p className="text-sm text-ink/60 mb-2">You can now sign in with your new password.</p>
        <p className="text-xs text-ink/40">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-ink mb-1" style={{ fontFamily: 'Georgia, serif' }}>Set new password</h2>
      <p className="text-sm text-ink/50 mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink/60">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-cream text-ink text-sm rounded-xl px-3 py-2.5 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink/60">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            className="w-full bg-cream text-ink text-sm rounded-xl px-3 py-2.5 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="mt-2 w-full py-3 bg-terra hover:bg-terra/90 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink/40">
        <Link href="/auth/login" className="text-terra hover:text-terra/80 font-medium transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
