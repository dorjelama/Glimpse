'use client';

import { useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import Toolbar from './Toolbar';
import MobileToolbar from './MobileToolbar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import MobileBottomBar, { type MobileSheet } from './MobileBottomBar';
import BottomSheet from './BottomSheet';
import PagesPanel from './PagesPanel';
import LayersPanel from './LayersPanel';
import GuestsPanel from './GuestsPanel';
// Element type buttons rendered inside the "Add" bottom sheet
import type { ElementType } from '../types';
import TemplatePickerModal from './TemplatePickerModal';
import type { CardTemplate } from '../templates';
const ADD_TYPES: { type: ElementType; icon: string; label: string; desc: string }[] = [
  { type: 'text',      icon: 'T',  label: 'Text',       desc: 'Add heading or body text' },
  { type: 'image',     icon: '🖼', label: 'Image',      desc: 'Upload or place an image' },
  { type: 'shape',     icon: '▭',  label: 'Shape',      desc: 'Rectangle, backdrop, accent' },
  { type: 'divider',   icon: '—',  label: 'Divider',    desc: 'Horizontal rule / separator' },
  { type: 'guestname', icon: '👤', label: 'Guest Name', desc: 'Personalised name per guest' },
  { type: 'countdown', icon: '⏱', label: 'Countdown',  desc: 'Live countdown to a target date' },
];

interface Props {
  eventId: string;
}

export default function EditorLayout({ eventId }: Props) {
  const loadEvent    = useEditorStore((s) => s.loadEvent);
  const event        = useEditorStore((s) => s.event);
  const selectedId   = useEditorStore((s) => s.selectedId);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const addElement    = useEditorStore((s) => s.addElement);
  const applyTemplate = useEditorStore((s) => s.applyTemplate);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);

  const [activeSheet, setActiveSheet] = useState<MobileSheet>(null);
  const closeSheet = () => setActiveSheet(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    loadEvent(eventId);
  }, [eventId, loadEvent]);

  // Show template picker once when the card has no elements
  useEffect(() => {
    if (!event) return;
    const firstPage = event.pages[0];
    if (firstPage && firstPage.elements.length === 0) {
      setShowTemplatePicker(true);
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTemplate = (tpl: CardTemplate) => {
    applyTemplate(tpl.pages);
    setShowTemplatePicker(false);
  };

  // Keyboard shortcuts (desktop)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isPreviewMode) return;
      const tag = (e.target as HTMLElement).tagName;
      const isEditable =
        (e.target as HTMLElement).isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT';
      if (isEditable) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
    },
    [selectedId, deleteElement, isPreviewMode],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!event) {
    return (
      <div className="min-h-screen bg-panel flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading event...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-panel text-white">
      {showTemplatePicker && (
        <TemplatePickerModal
          onSelect={handleSelectTemplate}
          onSkip={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Desktop toolbar */}
      <Toolbar />

      {/* Mobile toolbar */}
      <MobileToolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <ElementsPanel />
        <Canvas />
        <PropertiesPanel />
      </div>

      {/* Mobile bottom action bar */}
      <MobileBottomBar onOpenSheet={setActiveSheet} />

      {/* ── Mobile bottom sheets ── */}

      {/* Add elements */}
      <BottomSheet open={activeSheet === 'add'} onClose={closeSheet} title="Add Element" height="50vh">
        <div className="p-3 flex flex-col gap-1">
          {ADD_TYPES.map(({ type, icon, label, desc }) => (
            <button
              key={type}
              onClick={() => { addElement(type); closeSheet(); }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-left text-gray-200 hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-xl flex-shrink-0">
                {icon}
              </span>
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Properties */}
      <BottomSheet open={activeSheet === 'properties'} onClose={closeSheet} title="Properties" height="80vh">
        <PropertiesPanel mobile />
      </BottomSheet>

      {/* Pages */}
      <BottomSheet open={activeSheet === 'pages'} onClose={closeSheet} title="Pages" height="60vh">
        <PagesPanel />
      </BottomSheet>

      {/* Layers */}
      <BottomSheet open={activeSheet === 'layers'} onClose={closeSheet} title="Layers" height="60vh">
        <LayersPanel />
      </BottomSheet>

      {/* Guests */}
      <BottomSheet open={activeSheet === 'guests'} onClose={closeSheet} title="Guests" height="80vh">
        <GuestsPanel />
      </BottomSheet>
    </div>
  );
}
