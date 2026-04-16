import { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicViewClient from './PublicViewClient';

interface Props {
  params: { slug: string };
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
  const project = await fetchProject(params.slug);
  if (!project) {
    return { title: 'Invitation — Glimpse' };
  }
  const title = `${project.title} — You're invited!`;
  const description = `Open your invitation to ${project.title}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function PublicViewPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      }
    >
      <PublicViewClient slug={params.slug} />
    </Suspense>
  );
}
