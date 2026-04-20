'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { CanvasElement, ElementType } from '../types';

export type MobileSheet = 'add' | 'properties' | 'pages' | 'layers' | 'guests' | null;

const ADD_TYPES: { type: ElementType; icon: string; label: string }[] = [
  { type: 'text',      icon: 'T',  label: 'Text' },
  { type: 'image',     icon: '🖼', label: 'Image' },
  { type: 'shape',     icon: '▭',  label: 'Shape' },
  { type: 'divider',   icon: '—',  label: 'Line' },
  { type: 'guestname', icon: '👤', label: 'Guest' },
  { type: 'countdown', icon: '⏱', label: 'Timer' },
];

// ── Small presentational atoms ───────────────────────────────────────────────

function BarBtn({
  icon, label, onClick, active = false, danger = false,
}: {
  icon: React.ReactNode; label: string;
  onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] px-1.5 py-1 rounded-lg transition-colors active:scale-95 flex-shrink-0 ${
        danger   ? 'hover:bg-red-500/10' :
        active   ? 'bg-accent/30' :
                   'hover:bg-white/10'
      }`}
    >
      <span className={`flex items-center justify-center h-5 text-[16px] leading-none ${
        danger ? 'text-red-400' : active ? 'text-white' : 'text-gray-200'
      }`}>
        {icon}
      </span>
      <span className={`text-[9px] font-medium tracking-wide ${
        danger ? 'text-red-400' : active ? 'text-white' : 'text-gray-400'
      }`}>
        {label}
      </span>
    </button>
  );
}

function ColorSwatch({
  value, onChange, label,
}: {
  value: string; onChange: (v: string) => void; label: string;
}) {
  return (
    <label className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] px-1.5 py-1 rounded-lg hover:bg-white/10 flex-shrink-0 cursor-pointer">
      <span className="relative w-5 h-5 rounded-full border border-white/20 overflow-hidden" style={{ background: value || '#000' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </span>
      <span className="text-[9px] font-medium tracking-wide text-gray-400">{label}</span>
    </label>
  );
}

function NumStepper({
  value, onChange, label, step = 1, min, max,
}: {
  value: number; onChange: (v: number) => void; label: string;
  step?: number; min?: number; max?: number;
}) {
  const bump = (dir: 1 | -1) => {
    let next = value + dir * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 min-w-[72px] px-1 py-1 rounded-lg flex-shrink-0">
      <div className="flex items-center gap-1">
        <button onClick={() => bump(-1)} className="w-5 h-5 rounded bg-white/10 text-gray-200 text-xs leading-none active:bg-white/20">−</button>
        <span className="text-xs text-white font-medium tabular-nums min-w-[22px] text-center">{Math.round(value)}</span>
        <button onClick={() => bump(1)} className="w-5 h-5 rounded bg-white/10 text-gray-200 text-xs leading-none active:bg-white/20">+</button>
      </div>
      <span className="text-[9px] font-medium tracking-wide text-gray-400">{label}</span>
    </div>
  );
}

// ── Type-specific compact controls ───────────────────────────────────────────

function TextLikeControls({ element, setStyle }: {
  element: CanvasElement;
  setStyle: (changes: Record<string, any>) => void;
}) {
  const s = element.styles || {};
  const fontSize = parseInt(String(s.fontSize || '24'), 10) || 24;
  const isBold   = String(s.fontWeight || '') === '700' || s.fontWeight === 700;
  const isItalic = s.fontStyle === 'italic';
  const align    = (s.textAlign as string) || 'center';

  const cycleAlign = () => {
    const next = align === 'left' ? 'center' : align === 'center' ? 'right' : 'left';
    setStyle({ textAlign: next });
  };

  return (
    <>
      <ColorSwatch
        label="Color"
        value={s.color || '#1a1a1a'}
        onChange={(v) => setStyle({ color: v })}
      />
      <NumStepper
        label="Size"
        value={fontSize}
        step={2}
        min={8}
        max={400}
        onChange={(v) => setStyle({ fontSize: `${v}px` })}
      />
      <BarBtn
        label="Bold"
        icon={<span className="font-bold">B</span>}
        active={isBold}
        onClick={() => setStyle({ fontWeight: isBold ? '400' : '700' })}
      />
      <BarBtn
        label="Italic"
        icon={<span className="italic">I</span>}
        active={isItalic}
        onClick={() => setStyle({ fontStyle: isItalic ? 'normal' : 'italic' })}
      />
      <BarBtn
        label={align === 'left' ? 'Left' : align === 'right' ? 'Right' : 'Center'}
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6" x2={align === 'right' ? '21' : align === 'center' ? '20' : '15'} y2="6" />
            <line x1={align === 'center' ? '4' : '3'} y1="12" x2={align === 'center' ? '20' : '18'} y2="12" />
            <line x1={align === 'left' ? '3' : align === 'center' ? '6' : '9'} y1="18" x2="21" y2="18" />
          </svg>
        }
        onClick={cycleAlign}
      />
    </>
  );
}

function ImageControls({ element, set, setStyle }: {
  element: CanvasElement;
  set: (changes: Record<string, any>) => void;
  setStyle: (changes: Record<string, any>) => void;
}) {
  const s = element.styles || {};
  const opacity = typeof s.opacity === 'number' ? s.opacity : 1;
  const radius  = parseInt(String(s.borderRadius || '0'), 10) || 0;

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    set({ src: url, alt: file.name });
    e.target.value = '';
  };

  return (
    <>
      <label className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] px-1.5 py-1 rounded-lg hover:bg-white/10 flex-shrink-0 cursor-pointer">
        <span className="flex items-center justify-center h-5 text-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
        <span className="text-[9px] font-medium tracking-wide text-gray-400">Replace</span>
        <input type="file" accept="image/*" onChange={handleReplace} className="hidden" />
      </label>
      <NumStepper
        label="Opacity"
        value={Math.round(opacity * 100)}
        step={10}
        min={0}
        max={100}
        onChange={(v) => setStyle({ opacity: v / 100 })}
      />
      <NumStepper
        label="Radius"
        value={radius}
        step={4}
        min={0}
        max={400}
        onChange={(v) => setStyle({ borderRadius: `${v}px` })}
      />
    </>
  );
}

function ShapeControls({ element, setStyle }: {
  element: CanvasElement;
  setStyle: (changes: Record<string, any>) => void;
}) {
  const s = element.styles || {};
  const opacity = typeof s.opacity === 'number' ? s.opacity : 1;
  const radius  = parseInt(String(s.borderRadius || '0'), 10) || 0;
  return (
    <>
      <ColorSwatch
        label="Fill"
        value={s.backgroundColor || '#7c3aed'}
        onChange={(v) => setStyle({ backgroundColor: v })}
      />
      <NumStepper
        label="Radius"
        value={radius}
        step={4}
        min={0}
        max={400}
        onChange={(v) => setStyle({ borderRadius: `${v}px` })}
      />
      <NumStepper
        label="Opacity"
        value={Math.round(opacity * 100)}
        step={10}
        min={0}
        max={100}
        onChange={(v) => setStyle({ opacity: v / 100 })}
      />
    </>
  );
}

function DividerControls({ element, setStyle }: {
  element: CanvasElement;
  setStyle: (changes: Record<string, any>) => void;
}) {
  return (
    <ColorSwatch
      label="Color"
      value={element.styles?.backgroundColor || '#d1d5db'}
      onChange={(v) => setStyle({ backgroundColor: v })}
    />
  );
}

function CountdownControls({ element, setStyle }: {
  element: CanvasElement;
  setStyle: (changes: Record<string, any>) => void;
}) {
  const s = element.styles || {};
  const num = parseInt(String(s.numberFontSize || '48'), 10) || 48;
  return (
    <>
      <ColorSwatch
        label="Number"
        value={s.numberColor || '#1a1a1a'}
        onChange={(v) => setStyle({ numberColor: v })}
      />
      <ColorSwatch
        label="Box"
        value={s.boxBackgroundColor || '#f3f0ff'}
        onChange={(v) => setStyle({ boxBackgroundColor: v })}
      />
      <NumStepper
        label="Size"
        value={num}
        step={2}
        min={12}
        max={200}
        onChange={(v) => setStyle({ numberFontSize: `${v}px` })}
      />
    </>
  );
}

function TypeControls({ element, set, setStyle }: {
  element: CanvasElement;
  set: (changes: Record<string, any>) => void;
  setStyle: (changes: Record<string, any>) => void;
}) {
  switch (element.type) {
    case 'text':
    case 'button':
    case 'guestname': return <TextLikeControls element={element} setStyle={setStyle} />;
    case 'image':     return <ImageControls element={element} set={set} setStyle={setStyle} />;
    case 'shape':     return <ShapeControls element={element} setStyle={setStyle} />;
    case 'divider':   return <DividerControls element={element} setStyle={setStyle} />;
    case 'countdown': return <CountdownControls element={element} setStyle={setStyle} />;
    default:          return null;
  }
}

// ── Main component ───────────────────────────────────────────────────────────

type Props = {
  onOpenSheet: (sheet: MobileSheet) => void;
};

export default function MobileBottomBar({ onOpenSheet }: Props) {
  const selectedId       = useEditorStore((s) => s.selectedId);
  const currentPageId    = useEditorStore((s) => s.currentPageId);
  const event            = useEditorStore((s) => s.event);
  const addElement       = useEditorStore((s) => s.addElement);
  const updateElement    = useEditorStore((s) => s.updateElement);
  const deleteElement    = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const isPreviewMode    = useEditorStore((s) => s.isPreviewMode);

  // Publish our rendered height to the root element so the global StatusBar
  // can sit *above* this bar (rather than overlap) on mobile.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const apply = () => {
      const mq = window.matchMedia('(max-width: 767px)');
      const h = mq.matches ? `${el.getBoundingClientRect().height}px` : '0px';
      document.documentElement.style.setProperty('--mobile-bar-h', h);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener('change', apply);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', apply);
      document.documentElement.style.setProperty('--mobile-bar-h', '0px');
    };
  }, [selectedId, isPreviewMode]);

  if (isPreviewMode) return null;

  const currentPage = event?.pages.find((p) => p.id === currentPageId) ?? event?.pages[0];
  const element = selectedId ? currentPage?.elements.find((e) => e.id === selectedId) : null;

  // ── Element selected: compact inline properties bar ──
  if (element) {
    const set = (changes: Record<string, any>) => updateElement(element.id, changes);
    const setStyle = (changes: Record<string, any>) => updateElement(element.id, { styles: changes });

    return (
      <div ref={rootRef} className="md:hidden flex-shrink-0 bg-panel border-t border-white/10">
        <div className="flex items-stretch gap-0.5 px-2 py-1.5 overflow-x-auto">
          <TypeControls element={element} set={set} setStyle={setStyle} />

          <div className="w-px self-stretch bg-white/10 mx-1 flex-shrink-0" />

          <BarBtn
            label="Duplicate"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            }
            onClick={() => duplicateElement(element.id)}
          />
          <BarBtn
            label="Delete"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
              </svg>
            }
            danger
            onClick={() => deleteElement(element.id)}
          />
          <BarBtn
            label="More"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
              </svg>
            }
            onClick={() => onOpenSheet('properties')}
          />
        </div>
      </div>
    );
  }

  // ── Default: quick-add bar ──
  return (
    <div ref={rootRef} className="md:hidden flex-shrink-0 bg-panel border-t border-white/10">
      <div className="h-14 flex items-center px-2 gap-0.5 overflow-x-auto">
        {ADD_TYPES.map(({ type, icon, label }) => (
          <BarBtn
            key={type}
            icon={<span className="font-medium">{icon}</span>}
            label={label}
            onClick={() => addElement(type)}
          />
        ))}

        <div className="w-px h-8 bg-white/10 flex-shrink-0 mx-1 self-center" />

        <BarBtn
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          }
          label="Canvas"
          onClick={() => onOpenSheet('properties')}
        />
        <BarBtn
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          }
          label="Pages"
          onClick={() => onOpenSheet('pages')}
        />
        <BarBtn
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          }
          label="Layers"
          onClick={() => onOpenSheet('layers')}
        />
        <BarBtn
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          }
          label="Guests"
          onClick={() => onOpenSheet('guests')}
        />
      </div>
    </div>
  );
}
