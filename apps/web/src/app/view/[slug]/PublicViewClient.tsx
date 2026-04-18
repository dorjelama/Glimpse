'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type GlimpseEvent } from '@/lib/api';
import PreviewLayout from '@/modules/preview/components/PreviewLayout';

interface Props {
  slug: string;
}

export default function PublicViewClient({ slug }: Props) {
  const searchParams = useSearchParams();
  const guestToken = searchParams.get('g');

  const [event, setEvent] = useState<GlimpseEvent | null>(null);
  const [guestName, setGuestName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Suppress errors injected by crypto wallet browsers (MetaMask Mobile, Trust
  // Wallet, etc.) that pollute the page with window.ethereum noise unrelated to
  // this app. preventDefault stops the Next.js error overlay from showing them.
  useEffect(() => {
    const suppress = (e: ErrorEvent) => {
      const msg = e.message?.toLowerCase() ?? '';
      if (msg.includes('ethereum') || msg.includes('selectedaddress')) {
        e.preventDefault();
      }
    };
    window.addEventListener('error', suppress);
    return () => window.removeEventListener('error', suppress);
  }, []);

  useEffect(() => {
    api.getPublished(slug)
      .then(setEvent)
      .catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!guestToken) return;
    api.resolveGuest(guestToken)
      .then((g) => setGuestName(g.name))
      .catch(() => {});
  }, [guestToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Card not found</p>
          <p className="text-gray-500 text-sm">
            This card may have been unpublished or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <PreviewLayout event={event} isPublicView guestName={guestName} />
      {event.galleryId && (
        <a
          href={`/g/${event.galleryId}`}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1e1206', color: '#f5d99a', border: '1px solid #3d2810' }}
        >
          <span>📸</span>
          Share a Moment
        </a>
      )}
    </div>
  );
}
