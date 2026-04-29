'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { user, token: authToken } = useAuthStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found. Please use the link from your email.');
      return;
    }

    api.verifyEmail(token)
      .then(() => {
        setStatus('success');
        // If the user is logged in, redirect to dashboard after a short delay
        setTimeout(() => {
          if (authToken) {
            router.push('/dashboard');
          } else {
            router.push('/auth/login');
          }
        }, 2500);
      })
      .catch((err: any) => {
        setStatus('error');
        setErrorMsg(err.message ?? 'Verification failed. The link may be invalid.');
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'verifying') {
    return (
      <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-3xl mb-4 animate-pulse">✉️</div>
        <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: 'Georgia, serif' }}>Verifying…</h2>
        <p className="text-sm text-ink/50">Just a moment.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-3xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: 'Georgia, serif' }}>Email verified!</h2>
        <p className="text-sm text-ink/60 mb-2">You can now publish your cards.</p>
        <p className="text-xs text-ink/40">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-blush/50 border border-gold/30 rounded-2xl p-8 shadow-sm text-center">
      <div className="text-3xl mb-4">✗</div>
      <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: 'Georgia, serif' }}>Verification failed</h2>
      <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
      <Link href="/auth/login" className="text-sm text-terra hover:text-terra/80 font-medium transition-colors">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
