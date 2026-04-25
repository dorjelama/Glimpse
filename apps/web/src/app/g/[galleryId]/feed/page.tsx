import type { Metadata } from 'next';
import FeedClient from './FeedClient';

interface Props {
  params: { galleryId: string };
}

async function fetchGalleryTitle(galleryId: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  try {
    const res = await fetch(`${base}/gallery/${galleryId}/feed?sessionId=og`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.gallery?.project?.title ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = await fetchGalleryTitle(params.galleryId);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${base}/g/${params.galleryId}/feed`;

  const pageTitle = title ? `${title} — Live Glimpses` : 'Event Gallery — Glimpse';
  const description = title
    ? `See live guest photos from ${title}`
    : 'Live guest photo gallery powered by Glimpse';

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: 'website',
      url,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: pageTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: ['/og-default.png'],
    },
  };
}

export default function FeedPage({ params }: Props) {
  return <FeedClient params={params} />;
}
