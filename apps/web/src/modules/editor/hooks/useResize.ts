import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { CanvasElement } from '@/lib/api';
import type { ResizeHandle } from '../types';
import { MIN_SIZE } from '../types';

interface UseResizeOptions {
  element: CanvasElement;
  scale: number;
}

export function useResize({ element, scale }: UseResizeOptions) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const project = useEditorStore((s) => s.project);

  const onHandleMouseDown = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const startMX = e.clientX;
      const startMY = e.clientY;
      const startW = element.width;
      const startH = element.height;
      const startX = element.x;
      const startY = element.y;

      const onMove = (me: MouseEvent) => {
        if (!project) return;
        const dx = (me.clientX - startMX) / scale;
        const dy = (me.clientY - startMY) / scale;

        let x = startX;
        let y = startY;
        let w = startW;
        let h = startH;

        // Horizontal
        if (handle.includes('e')) {
          w = Math.max(MIN_SIZE.width, Math.min(startW + dx, project.canvas.width - startX));
        }
        if (handle.includes('w')) {
          const newW = Math.max(MIN_SIZE.width, startW - dx);
          x = startX + (startW - newW);
          w = newW;
        }

        // Vertical
        if (handle.includes('s')) {
          h = Math.max(MIN_SIZE.height, Math.min(startH + dy, project.canvas.height - startY));
        }
        if (handle.includes('n')) {
          const newH = Math.max(MIN_SIZE.height, startH - dy);
          y = startY + (startH - newH);
          h = newH;
        }

        updateElement(element.id, {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(w),
          height: Math.round(h),
        });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [element, scale, project, updateElement],
  );

  return { onHandleMouseDown };
}
