'use client';

import { useState } from 'react';
import { useEditorStore } from '../store/editorStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  text:      'T',
  image:     '🖼',
  shape:     '▭',
  button:    '⊡',
  divider:   '—',
  guestname: '👤',
  countdown: '⏱',
};

const GROUP_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#db2777'];
function groupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) hash = (hash * 31 + groupId.charCodeAt(i)) & 0xffff;
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LockClosedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LayersPanel() {
  const event          = useEditorStore((s) => s.event);
  const currentPageId  = useEditorStore((s) => s.currentPageId);
  const selectedIds    = useEditorStore((s) => s.selectedIds);
  const selectElement  = useEditorStore((s) => s.selectElement);
  const addToSelection = useEditorStore((s) => s.addToSelection);
  const toggleLock     = useEditorStore((s) => s.toggleLock);
  const toggleHidden   = useEditorStore((s) => s.toggleHidden);
  const setElementName = useEditorStore((s) => s.setElementName);

  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!event) return null;
  const currentPage = event.pages.find((p) => p.id === currentPageId) ?? event.pages[0];
  if (!currentPage) return null;

  // Highest z-index first (= "top" of the visual stack)
  const layers = [...currentPage.elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
      {layers.length === 0 && (
        <p className="text-[10px] text-gray-500 px-2 py-3">No elements on this page.</p>
      )}

      {layers.map((el) => {
        const isSelected  = selectedIds.includes(el.id);
        const isLocked    = !!el.styles?._locked;
        const isHidden    = !!el.styles?._hidden;
        const gid         = el.styles?._groupId as string | undefined;
        const displayName = (el.styles?._name as string | undefined) ?? capitalize(el.type);
        const borderColor = gid ? groupColor(gid) : 'transparent';

        return (
          <div
            key={el.id}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) addToSelection(el.id);
              else selectElement(el.id);
            }}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group
              ${isSelected ? 'bg-accent/20 text-white' : 'text-gray-300 hover:bg-white/10'}
              ${isHidden ? 'opacity-40' : ''}`}
            style={{ borderLeft: `2px solid ${borderColor}` }}
          >
            {/* Type icon */}
            <span className="w-5 text-center text-[11px] flex-shrink-0 text-gray-400 select-none">
              {TYPE_ICON[el.type] ?? '?'}
            </span>

            {/* Editable name */}
            {editingId === el.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  setElementName(el.id, editingName.trim());
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setElementName(el.id, editingName.trim());
                    setEditingId(null);
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 bg-white/10 text-white text-xs rounded px-1 py-0.5 border border-accent focus:outline-none"
              />
            ) : (
              <span
                className="flex-1 min-w-0 text-xs truncate select-none"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(el.id);
                  setEditingName((el.styles?._name as string | undefined) ?? displayName);
                }}
                title="Double-click to rename"
              >
                {displayName}
              </span>
            )}

            {/* Eye / visibility toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleHidden(el.id); }}
              title={isHidden ? 'Show on canvas' : 'Hide on canvas'}
              className={`flex-shrink-0 p-0.5 rounded transition-colors
                ${isHidden
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-white'
                }`}
            >
              {isHidden ? <EyeOffIcon /> : <EyeIcon />}
            </button>

            {/* Lock toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
              title={isLocked ? 'Unlock element' : 'Lock element'}
              className={`flex-shrink-0 p-0.5 rounded transition-colors
                ${isLocked
                  ? 'text-yellow-400 hover:text-yellow-300'
                  : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-white'
                }`}
            >
              {isLocked ? <LockClosedIcon /> : <LockOpenIcon />}
            </button>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-auto pt-3 border-t border-white/10 flex-shrink-0">
        <p className="text-[9px] text-gray-600 px-2 leading-relaxed">
          Click to select · Ctrl+click multi-select · Double-click name to rename
        </p>
      </div>
    </div>
  );
}
