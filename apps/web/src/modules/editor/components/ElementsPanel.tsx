'use client';

import { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ElementType } from '../types';
import PagesPanel from './PagesPanel';
import GuestsPanel from './GuestsPanel';
import LayersPanel from './LayersPanel';

const ELEMENT_TYPES: { type: ElementType; label: string; icon: string; desc: string }[] = [
  { type: 'text',      label: 'Text',       icon: 'T',  desc: 'Add heading or body text' },
  { type: 'image',     label: 'Image',      icon: '🖼', desc: 'Upload or place an image' },
  { type: 'shape',     label: 'Shape',      icon: '▭',  desc: 'Rectangle, backdrop, accent' },
  { type: 'divider',   label: 'Divider',    icon: '—',  desc: 'Horizontal rule / separator' },
  { type: 'guestname', label: 'Guest Name', icon: '👤', desc: 'Personalised name per guest' },
  { type: 'countdown', label: 'Countdown',  icon: '⏱', desc: 'Live countdown to a target date' },
];

type Tab = 'pages' | 'elements' | 'layers' | 'guests';

export default function ElementsPanel() {
  const addElement    = useEditorStore((s) => s.addElement);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const event         = useEditorStore((s) => s.event);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const [activeTab, setActiveTab] = useState<Tab>('elements');

  if (isPreviewMode) return null;

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('elementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const pageCount      = event?.pages.length ?? 0;
  const currentPageIdx = event?.pages.findIndex((p) => p.id === currentPageId) ?? -1;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pages',    label: pageCount > 0 ? `Pages (${currentPageIdx + 1}/${pageCount})` : 'Pages' },
    { id: 'elements', label: 'Add' },
    { id: 'layers',   label: 'Layers' },
    { id: 'guests',   label: 'Guests' },
  ];

  return (
    <aside className="w-56 bg-panel border-r border-white/10 hidden md:flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-[10px] font-medium transition-colors leading-tight px-1
              ${activeTab === id
                ? 'text-white border-b-2 border-accent'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'pages'    && <PagesPanel />}
      {activeTab === 'guests'   && <GuestsPanel />}
      {activeTab === 'layers'   && <LayersPanel />}

      {activeTab === 'elements' && (
        <>
          <div className="p-2 flex flex-col gap-1 flex-1 overflow-y-auto">
            {ELEMENT_TYPES.map(({ type, label, icon, desc }) => (
              <button
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                onClick={() => addElement(type)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                           text-gray-200 hover:bg-white/10 active:bg-white/20
                           transition-colors cursor-grab active:cursor-grabbing group"
                title={desc}
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-md bg-white/10 text-lg flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                  {icon}
                </span>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[10px] text-gray-400">{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Drag elements onto the canvas, or click to add at center.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
