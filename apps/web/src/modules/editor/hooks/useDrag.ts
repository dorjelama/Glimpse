import { useCallback, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { CanvasElement } from '@/lib/api';

interface UseDragOptions {
  element: CanvasElement;
  canvasRef: React.RefObject<HTMLDivElement>;
  scale: number;
}

export function useDrag({ element, canvasRef, scale }: UseDragOptions) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const selectElement = useEditorStore((s) => s.selectElement);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const project = useEditorStore((s) => s.project);

  const dragRef = useRef({
    active: false,
    startMouseX: 0,
    startMouseY: 0,
    startElX: 0,
    startElY: 0,
  });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPreviewMode) return;
      // Only drag on the element body, not on resize handles
      if ((e.target as HTMLElement).dataset.handle) return;

      e.stopPropagation();
      e.preventDefault();
      selectElement(element.id);

      const d = dragRef.current;
      d.active = true;
      d.startMouseX = e.clientX;
      d.startMouseY = e.clientY;
      d.startElX = element.x;
      d.startElY = element.y;

      const onMove = (me: MouseEvent) => {
        if (!d.active) return;
        const canvas = canvasRef.current;
        if (!canvas || !project) return;

        const dx = (me.clientX - d.startMouseX) / scale;
        const dy = (me.clientY - d.startMouseY) / scale;

        const newX = Math.round(
          Math.max(0, Math.min(d.startElX + dx, project.canvas.width - element.width)),
        );
        const newY = Math.round(
          Math.max(0, Math.min(d.startElY + dy, project.canvas.height - element.height)),
        );

        updateElement(element.id, { x: newX, y: newY });
      };

      const onUp = () => {
        d.active = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [element, canvasRef, scale, project, updateElement, selectElement, isPreviewMode],
  );

  return { onMouseDown };
}
