'use client';

import Image from 'next/image';
import type { CanvasElement } from '@/lib/api';

interface Props {
  element: CanvasElement;
}

export default function ImageElement({ element }: Props) {
  if (!element.src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e5e7eb',
          color: '#6b7280',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          borderRadius: element.styles.borderRadius || '0px',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span>Double-click to upload</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={element.src}
      alt={element.alt || 'Image'}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...element.styles,
      }}
    />
  );
}
