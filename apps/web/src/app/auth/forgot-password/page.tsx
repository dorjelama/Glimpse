'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-3xl mb-4">📬</div>
        <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: 'Georgia, serif' }}>Check your inbox</h2>
        <p className="text-sm text-ink/60 leading-relaxed mb-6">
          If <strong>{email}</strong> is registered, we've sent a password reset link. Check your inbox (and spam folder).
        </p>
        <Link href="/auth/login" className="text-sm text-terra hover:text-terra/80 font-medium transition-colors">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-ink mb-1" style={{ fontFamily: 'Georgia, serif' }}>Forgot password?</h2>
      <p className="text-sm text-ink/50 mb-6">Enter your email and we'll send a reset link.</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink/60">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-cream text-ink text-sm rounded-xl px-3 py-2.5 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 bg-terra hover:bg-terra/90 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink/40">
        Remembered it?{' '}
        <Link href="/auth/login" className="text-terra hover:text-terra/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
