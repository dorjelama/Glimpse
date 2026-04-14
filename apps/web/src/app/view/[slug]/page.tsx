'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type Project } from '@/lib/api';
import PreviewLayout from '@/modules/preview/components/PreviewLayout';

interface Props {
  params: { slug: string };
}

export default function PublicViewPage({ params }: Props) {
  const searchParams = useSearchParams();
  const guestToken = searchParams.get('g');

  const [project, setProject] = useState<Project | null>(null);
  const [guestName, setGuestName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPublished(params.slug)
      .then(setProject)
      .catch((e) => setError(e.message));
  }, [params.slug]);

  useEffect(() => {
    if (!guestToken) return;
    api.resolveGuest(guestToken)
      .then((g) => setGuestName(g.name))
      .catch(() => {}); // silently ignore invalid tokens
  }, [guestToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Invitation not found</p>
          <p className="text-gray-500 text-sm">This invitation may have been unpublished or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return <PreviewLayout project={project} isPublicView guestName={guestName} />;
}
