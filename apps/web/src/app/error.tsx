'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center px-5 text-center"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Unexpected error</p>
      <h1
        className="mt-3 text-3xl font-bold text-ink"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/55">
        An unexpected error occurred. If the problem persists, please contact{' '}
        <a href="mailto:hello@glimpse.app" className="text-terra underline underline-offset-2">
          hello@glimpse.app
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-terra px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terra/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-ink/20 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-terra/40 hover:text-terra"
        >
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-[11px] text-ink/25">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
