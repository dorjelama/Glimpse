'use client';

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import Toolbar from './Toolbar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';

interface Props {
  eventId: string;
}

export default function EditorLayout({ eventId }: Props) {
  const loadEvent = useEditorStore((s) => s.loadEvent);
  const event = useEditorStore((s) => s.event);
  const selectedId = useEditorStore((s) => s.selectedId);
  const deleteElement = useEditorStore((s) => s.deleteElement);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);

  useEffect(() => {
    loadEvent(eventId);
  }, [eventId, loadEvent]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isPreviewMode) return;
      // Don't intercept when typing in inputs / contenteditable
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
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <ElementsPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}
