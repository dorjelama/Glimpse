'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) router.replace('/');
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent placeholder-gray-600"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:border-accent placeholder-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
