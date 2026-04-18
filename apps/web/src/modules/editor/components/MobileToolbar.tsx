'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../store/editorStore';
import PublishModal from '../../publish/components/PublishModal';
import UserMenu from '@/components/UserMenu';

export default function MobileToolbar() {
  const router = useRouter();
  const event = useEditorStore((s) => s.event);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const saveNow = useEditorStore((s) => s.saveNow);
  const updateTitle = useEditorStore((s) => s.updateTitle);

  const [showMenu, setShowMenu] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  if (!event) return null;

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) updateTitle(titleDraft.trim());
  };

  return (
    <>
      <header className="h-12 bg-panel border-b border-white/10 flex items-center px-3 gap-2 flex-shrink-0 md:hidden">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }}
            className="flex-1 bg-white/10 text-white text-sm font-medium rounded-md px-2 py-1 border border-accent focus:outline-none min-w-0"
          />
        ) : (
          <button
            onClick={() => { setTitleDraft(event.title); setEditingTitle(true); }}
            className="flex-1 text-sm font-medium text-gray-200 text-left truncate min-w-0"
          >
            {event.title}
          </button>
        )}

        {/* Preview toggle */}
        <button
          onClick={() => setPreviewMode(!isPreviewMode)}
          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
            isPreviewMode
              ? 'bg-white text-purple-900'
              : 'bg-white/10 text-white'
          }`}
        >
          {isPreviewMode ? 'Edit' : 'Preview'}
        </button>

        {/* More menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl z-40 min-w-[180px] overflow-hidden">
                <button
                  onClick={() => { saveNow(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Save
                </button>
                <button
                  onClick={() => { setShowPublish(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-purple-400 hover:bg-white/10 flex items-center gap-3"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Publish
                </button>
                <div className="border-t border-white/10 px-4 py-2">
                  <UserMenu />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </>
  );
}
