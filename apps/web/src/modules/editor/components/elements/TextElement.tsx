'use client';

import { useRef, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { CanvasElement } from '@/lib/api';
import { cssStyles } from '../../utils/cssStyles';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  isPreview: boolean;
}

export default function TextElement({ element, isSelected, isPreview }: Props) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const ref = useRef<HTMLDivElement>(null);

  const enterEditMode = useCallback(() => {
    if (!ref.current) return;
    ref.current.contentEditable = 'true';
    ref.current.focus();
    // Place cursor at end
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreview) return;
      e.stopPropagation();
      enterEditMode();
    },
    [isPreview, enterEditMode],
  );

  // On touch devices, a tap on an already-selected text element enters edit mode
  // (desktop still uses double-click; avoids breaking single-click selection behaviour)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreview || !isSelected) return;
      const isTouch =
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: none), (pointer: coarse)').matches;
      if (!isTouch) return;
      e.stopPropagation();
      enterEditMode();
    },
    [isPreview, isSelected, enterEditMode],
  );

  const handleBlur = useCallback(() => {
    if (ref.current) {
      ref.current.contentEditable = 'false';
      updateElement(element.id, { content: ref.current.innerText });
    }
  }, [element.id, updateElement]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && ref.current) {
      ref.current.contentEditable = 'false';
      ref.current.blur();
    }
  }, []);

  return (
    <div
      ref={ref}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        wordBreak: 'break-word',
        cursor: isPreview ? 'default' : 'move',
        ...cssStyles(element.styles),
      }}
    >
      {element.content || 'Your text here'}
    </div>
  );
}
