'use client';

import { useState } from 'react';
import { usePublish } from '../hooks/usePublish';

interface Props {
  onClose: () => void;
}

export default function PublishModal({ onClose }: Props) {
  const { project, publish, unpublish, publishing, error } = usePublish();
  const [published, setPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const handlePublish = async () => {
    const result = await publish();
    if (result) {
      setPublicUrl(`${origin}/view/${result.project.slug}`);
      setPublished(true);
    }
  };

  const handleCopy = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAlreadyPublished = project?.status === 'published';
  const existingUrl = project?.slug ? `${origin}/view/${project.slug}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-panel rounded-2xl shadow-2xl border border-white/10 w-[440px] max-w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">
            {isAlreadyPublished ? 'Published' : 'Publish Invitation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {isAlreadyPublished || published ? (
            <>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span>✓</span>
                <span>Your invitation is live!</span>
              </div>

              <div className="flex gap-2">
                <input
                  readOnly
                  value={publicUrl || existingUrl || ''}
                  className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors font-medium"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <a
                href={publicUrl || existingUrl || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Open in new tab →
              </a>

              <button
                onClick={async () => {
                  await unpublish();
                  setPublished(false);
                  setPublicUrl(null);
                }}
                disabled={publishing}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Unpublish
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-300 text-sm leading-relaxed">
                Publishing will generate a public shareable link anyone can open without signing in.
              </p>

              <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>📄</span>
                  <span className="font-medium truncate">{project?.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🎨</span>
                  <span>{project?.pages.reduce((n, p) => n + p.elements.length, 0)} element{project?.pages.reduce((n, p) => n + p.elements.length, 0) !== 1 ? 's' : ''}</span>
                  <span className="mx-1">·</span>
                  <span>{project?.canvas.width}×{project?.canvas.height}px</span>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
