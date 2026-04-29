import { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicViewClient from './PublicViewClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchProject(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  try {
    const res = await fetch(`${base}/publish/view/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!project) {
    return {
      title: 'Invitation — Glimpse',
      openGraph: { images: [{ url: '/og-default.png', width: 1200, height: 630 }] },
    };
  }

  const title = `${project.title} — You're invited!`;
  const description = `Open your invitation to ${project.title}`;
  const url = `${base}/view/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  };
}

export default async function PublicViewPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      }
    >
      <PublicViewClient slug={slug} />
    </Suspense>
  );
}
