'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  function start() {
    if (activeRef.current) return;
    activeRef.current = true;
    setWidth(0);
    setVisible(true);

    let w = 0;
    timerRef.current = setInterval(() => {
      // Ease toward 85% — never reaches 100 until done() is called
      w = Math.min(w + Math.random() * 12 + 3, 85);
      setWidth(w);
    }, 180);
  }

  function done() {
    if (timerRef.current) clearInterval(timerRef.current);
    setWidth(100);
    const t = setTimeout(() => {
      setVisible(false);
      activeRef.current = false;
    }, 300);
    return () => clearTimeout(t);
  }

  // Detect any internal link click to kick off the bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      // Skip external, hash, or blank-target links
      if (!href || href.startsWith('#') || href.startsWith('http') || anchor.target === '_blank') return;
      start();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Pathname change = navigation completed
  useEffect(() => {
    done();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-accent"
        style={{
          width: `${width}%`,
          transition: width === 100 ? 'width 200ms ease-out' : 'width 180ms linear',
          boxShadow: '0 0 8px var(--color-accent, #7c3aed)',
        }}
      />
    </div>
  );
}
