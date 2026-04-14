'use client';

import { useEffect, useState } from 'react';
import { api, type Project } from '@/lib/api';
import PreviewLayout from '@/modules/preview/components/PreviewLayout';

interface Props {
  params: { id: string };
}

export default function PreviewPage({ params }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProject(params.id)
      .then(setProject)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading preview...</p>
      </div>
    );
  }

  return <PreviewLayout project={project} />;
}
