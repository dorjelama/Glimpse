import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found — Glimpse',
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center px-5 text-center"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">404</p>
      <h1
        className="mt-3 text-3xl font-bold text-ink"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/55">
        The link you followed may be expired, unpublished, or it never existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-terra px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terra/90"
        >
          Go home
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg border border-ink/20 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-terra/40 hover:text-terra"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
