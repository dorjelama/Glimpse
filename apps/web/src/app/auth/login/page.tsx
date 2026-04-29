'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuthStore } from '@/lib/authStore';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function LoginPage() {
  const router = useRouter();
  const { login, token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(TURNSTILE_SITE_KEY ? null : 'skip');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password, cfTurnstileToken: turnstileToken ?? undefined });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      setTurnstileToken(TURNSTILE_SITE_KEY ? null : 'skip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-ink mb-1" style={{ fontFamily: 'Georgia, serif' }}>Welcome back</h2>
      <p className="text-sm text-ink/50 mb-6">Sign in to your account</p>

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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-ink/60">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-terra hover:text-terra/80 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-cream text-ink text-sm rounded-xl px-3 py-2.5 border border-gold/40 focus:outline-none focus:border-terra placeholder:text-ink/30 transition-colors"
          />
        </div>

        {TURNSTILE_SITE_KEY && (
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        )}

        <button
          type="submit"
          disabled={loading || !turnstileToken}
          className="mt-2 w-full py-3 bg-terra hover:bg-terra/90 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink/40">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-terra hover:text-terra/80 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
