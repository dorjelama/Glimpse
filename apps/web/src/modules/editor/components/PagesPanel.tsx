'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export default function PagesPanel() {
  const project = useEditorStore((s) => s.project);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const renamePage = useEditorStore((s) => s.renamePage);
  const reorderPage = useEditorStore((s) => s.reorderPage);

  // Track which page is being renamed inline
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  if (!project) return null;

  const pages = project.pages;
  const canDelete = pages.length > 1;

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renamePage(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenamingId(null);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {pages.map((page, idx) => {
          const isActive = page.id === currentPageId;
          const isRenaming = renamingId === page.id;

          return (
            <div
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              onDoubleClick={() => startRename(page.id, page.name)}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-accent/20 border border-accent/50'
                  : 'hover:bg-white/10 border border-transparent'
              }`}
            >
              {/* Page thumbnail swatch */}
              <div
                className="w-8 h-10 rounded flex-shrink-0 border border-white/20 overflow-hidden"
                style={{ backgroundColor: page.backgroundColor }}
              >
                {page.backgroundImage && (
                  <img
                    src={page.backgroundImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Page name / rename input */}
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleRenameKey}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/10 text-white text-xs rounded px-1.5 py-0.5 border border-accent focus:outline-none"
                  />
                ) : (
                  <div className="text-xs text-gray-200 truncate">{page.name}</div>
                )}
                <div className="text-[10px] text-gray-500">{idx + 1} of {pages.length}</div>
              </div>

              {/* Reorder + delete controls (visible on hover) */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); reorderPage(page.id, 'up'); }}
                  disabled={idx === 0}
                  className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-[10px] rounded hover:bg-white/10 transition-colors"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderPage(page.id, 'down'); }}
                  disabled={idx === pages.length - 1}
                  className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-[10px] rounded hover:bg-white/10 transition-colors"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                disabled={!canDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-red-500/10 transition-colors text-xs"
                title={canDelete ? 'Delete page' : 'Cannot delete the only page'}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add page button */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={addPage}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-purple-300 hover:text-white hover:bg-accent/20 border border-dashed border-white/20 hover:border-accent/50 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add Page
        </button>
      </div>
    </div>
  );
}
