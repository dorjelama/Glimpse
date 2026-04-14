'use client';

import { useRef, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { CanvasElement } from '@/lib/api';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  isPreview: boolean;
}

export default function TextElement({ element, isSelected, isPreview }: Props) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const ref = useRef<HTMLDivElement>(null);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPreview) return;
      e.stopPropagation();
      if (ref.current) {
        ref.current.contentEditable = 'true';
        ref.current.focus();
        // Place cursor at end
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
    [isPreview],
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
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        wordBreak: 'break-word',
        cursor: isPreview ? 'default' : 'move',
        ...element.styles,
      }}
    >
      {element.content || 'Your text here'}
    </div>
  );
}
