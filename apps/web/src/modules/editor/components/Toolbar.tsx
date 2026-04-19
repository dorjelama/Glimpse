'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/editorStore';
import PublishModal from '../../publish/components/PublishModal';
import UserMenu from '@/components/UserMenu';

export default function Toolbar() {
  const router = useRouter();
  const event = useEditorStore((s) => s.event);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const updateTitle = useEditorStore((s) => s.updateTitle);
  const saveNow = useEditorStore((s) => s.saveNow);
  const selectedId = useEditorStore((s) => s.selectedId);
  const deleteElement = useEditorStore((s) => s.deleteElement);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showPublish, setShowPublish] = useState(false);

  if (!event) return null;

  const handleTitleClick = () => {
    setTitleDraft(event.title);
    setEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) updateTitle(titleDraft.trim());
  };

  const handleTitleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <>
      <header className="h-12 bg-panel border-b border-white/10 hidden md:flex items-center px-4 gap-4 flex-shrink-0">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Back to dashboard"
        >
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0"
            style={{ backgroundImage: 'url("/App Icon and Favicon Dark.png")', backgroundSize: '180%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Glimpse</span>
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* Editable title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKey}
            className="bg-white/10 text-white text-sm font-medium rounded-md px-2 py-1 border border-accent focus:outline-none w-48"
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className="text-sm font-medium text-gray-200 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-colors truncate max-w-[200px]"
            title="Click to rename"
          >
            {event.title}
          </button>
        )}

        <div className="flex-1" />

        {/* Keyboard shortcut hint */}
        {selectedId && !isPreviewMode && (
          <span className="text-xs text-gray-500 hidden md:block">
            Del → remove element
          </span>
        )}

        {/* Delete selected */}
        {selectedId && !isPreviewMode && (
          <button
            onClick={() => deleteElement(selectedId)}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
        )}

        {/* Preview toggle */}
        <button
          onClick={() => setPreviewMode(!isPreviewMode)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isPreviewMode
              ? 'bg-white text-purple-900 hover:bg-gray-100'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isPreviewMode ? 'Edit' : 'Preview'}
        </button>

        {/* Save */}
        <button
          onClick={saveNow}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Save
        </button>

        {/* Publish */}
        <button
          onClick={() => setShowPublish(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
        >
          Publish
        </button>

        <div className="w-px h-6 bg-white/10" />
        <UserMenu />
      </header>

      {showPublish && (
        <PublishModal onClose={() => setShowPublish(false)} />
      )}
    </>
  );
}
