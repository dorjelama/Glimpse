'use client';

import { useEditorStore } from '../store/editorStore';
import type { ElementType } from '../types';

export type MobileSheet = 'add' | 'properties' | 'pages' | 'layers' | null;

const ADD_TYPES: { type: ElementType; icon: string; label: string }[] = [
  { type: 'text',      icon: 'T',  label: 'Text' },
  { type: 'image',     icon: '🖼', label: 'Image' },
  { type: 'shape',     icon: '▭',  label: 'Shape' },
  { type: 'divider',   icon: '—',  label: 'Line' },
  { type: 'guestname', icon: '👤', label: 'Guest' },
  { type: 'countdown', icon: '⏱', label: 'Timer' },
];

function BarButton({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 rounded-xl transition-colors active:scale-95 ${
        danger ? 'hover:bg-red-500/10' : 'hover:bg-white/10'
      }`}
    >
      <span className={`text-[20px] leading-none ${danger ? 'text-red-400' : ''}`}>{icon}</span>
      <span className={`text-[9px] font-medium tracking-wide ${danger ? 'text-red-400' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
}

type Props = {
  onOpenSheet: (sheet: MobileSheet) => void;
};

export default function MobileBottomBar({ onOpenSheet }: Props) {
  const selectedId       = useEditorStore((s) => s.selectedId);
  const addElement       = useEditorStore((s) => s.addElement);
  const deleteElement    = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const isPreviewMode    = useEditorStore((s) => s.isPreviewMode);

  if (isPreviewMode) return null;

  // ── Element selected: contextual action bar (Canva-style) ──
  if (selectedId) {
    return (
      <div className="md:hidden flex-shrink-0 bg-panel border-t border-white/10 safe-area-bottom">
        <div className="h-14 flex items-center px-3 gap-1 overflow-x-auto scrollbar-none">
          <BarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            }
            label="Properties"
            onClick={() => onOpenSheet('properties')}
          />

          <div className="w-px h-8 bg-white/10 flex-shrink-0 mx-0.5" />

          <BarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            }
            label="Duplicate"
            onClick={() => duplicateElement(selectedId)}
          />

          <BarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            }
            label="Delete"
            onClick={() => deleteElement(selectedId)}
            danger
          />

          <div className="flex-1" />

          <BarButton
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            }
            label="Layers"
            onClick={() => onOpenSheet('layers')}
          />
        </div>
      </div>
    );
  }

  // ── Default: quick-add bar ──
  return (
    <div className="md:hidden flex-shrink-0 bg-panel border-t border-white/10 safe-area-bottom">
      <div className="h-14 flex items-center px-2 gap-0.5 overflow-x-auto scrollbar-none">
        {ADD_TYPES.map(({ type, icon, label }) => (
          <BarButton
            key={type}
            icon={<span className="font-medium">{icon}</span>}
            label={label}
            onClick={() => addElement(type)}
          />
        ))}

        <div className="w-px h-8 bg-white/10 flex-shrink-0 mx-1" />

        <BarButton
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          }
          label="Pages"
          onClick={() => onOpenSheet('pages')}
        />

        <BarButton
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          }
          label="Layers"
          onClick={() => onOpenSheet('layers')}
        />
      </div>
    </div>
  );
}
