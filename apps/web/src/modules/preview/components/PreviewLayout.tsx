'use client';

import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/api';
import PreviewCanvas from './PreviewCanvas';

interface Props {
  project: Project;
  isPublicView?: boolean;
  guestName?: string;
}

export default function PreviewLayout({ project, isPublicView = false, guestName }: Props) {
  const router = useRouter();

  return (
    // 100dvh shrinks when the mobile browser chrome slides away,
    // preventing the layout from jumping or overflowing the screen.
    <div className="h-dvh flex flex-col bg-canvas overflow-hidden">
      {/* Mini top bar — hidden in public view to give guests a full-screen canvas */}
      {!isPublicView && (
        <header className="h-10 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0 min-w-0">
          <button
            onClick={() => router.push(`/editor/${project.id}`)}
            className="text-xs text-purple-700 hover:text-purple-900 font-medium whitespace-nowrap flex-shrink-0"
          >
            ← Back to Editor
          </button>
          <span className="text-sm font-medium text-gray-700 truncate min-w-0">{project.title}</span>
          {project.status === 'published' && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
              Published
            </span>
          )}
        </header>
      )}

      <PreviewCanvas project={project} guestName={guestName} />
    </div>
  );
}
