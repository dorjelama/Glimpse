'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'glimpse-cookies-accepted';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream/10 bg-ink px-5 py-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-cream/70">
          We use essential cookies and local storage to keep you signed in and save your editor state. No tracking or advertising.{' '}
          <Link href="/privacy" className="text-cream/90 underline underline-offset-2 transition-colors hover:text-cream">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 rounded-lg bg-cream px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-blush"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
