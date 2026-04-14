'use client';

import { useEffect, useState } from 'react';
import { useStatusStore, type StatusType } from '@/lib/statusStore';

const BAR_COLOR: Record<StatusType, string> = {
  loading: 'bg-accent',
  success: 'bg-green-500',
  error:   'bg-red-500',
};

const TEXT_COLOR: Record<StatusType, string> = {
  loading: 'text-purple-300',
  success: 'text-green-400',
  error:   'text-red-400',
};

const ICON: Record<StatusType, string> = {
  loading: '◌',   // replaced by spinner below
  success: '✓',
  error:   '✕',
};

export default function StatusBar() {
  const { visible, message, type, dismiss } = useStatusStore();

  // Controls the CSS-transitioned progress bar width (0-100).
  const [barWidth, setBarWidth] = useState(0);
  // Controls the slide-in/out of the whole bar.
  const [shown, setShown] = useState(false);

  // Slide in / out when visibility changes.
  useEffect(() => {
    if (visible) {
      setShown(true);
    } else {
      // Delay unmounting so the slide-out animation can play.
      const t = setTimeout(() => setShown(false), 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Animate the progress bar width based on type transitions.
  useEffect(() => {
    if (!visible) {
      setBarWidth(0);
      return;
    }

    if (type === 'loading') {
      // Two-frame trick: reset to 0 then animate to 80 % so the
      // CSS transition actually fires when we go loading → loading again.
      setBarWidth(0);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setBarWidth(80));
      });
      return () => cancelAnimationFrame(raf);
    }

    if (type === 'success') {
      setBarWidth(100);
      // Auto-dismiss after the bar reaches 100 % and lingers briefly.
      const t = setTimeout(() => dismiss(), 2000);
      return () => clearTimeout(t);
    }

    if (type === 'error') {
      setBarWidth(0); // No progress bar for errors — just the message.
    }
  }, [visible, type, dismiss]);

  if (!shown && !visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Progress bar — sits as a 2px strip along the very top edge */}
      <div className="relative h-0.5 bg-white/5">
        {type !== 'error' && (
          <div
            className={`absolute inset-y-0 left-0 ${BAR_COLOR[type]} transition-[width] duration-700 ease-out`}
            style={{ width: `${barWidth}%` }}
          />
        )}
      </div>

      {/* Status row */}
      <div className="bg-panel border-t border-white/10 px-4 h-7 flex items-center gap-2.5">
        {/* Icon / spinner */}
        {type === 'loading' ? (
          <svg
            className="w-3 h-3 text-purple-400 animate-spin flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <span className={`text-xs font-bold flex-shrink-0 ${TEXT_COLOR[type]}`}>
            {ICON[type]}
          </span>
        )}

        {/* Message */}
        <span className={`text-xs flex-1 truncate ${TEXT_COLOR[type]}`}>
          {message}
        </span>

        {/* Dismiss — only for errors (success auto-dismisses) */}
        {type === 'error' && (
          <button
            onClick={dismiss}
            className="text-gray-500 hover:text-gray-300 text-xs flex-shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
