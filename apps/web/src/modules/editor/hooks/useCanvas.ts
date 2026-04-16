import { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ElementType } from '../types';

export function useCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const event = useEditorStore((s) => s.event);
  const selectElement = useEditorStore((s) => s.selectElement);
  const addElement = useEditorStore((s) => s.addElement);

  // Fit canvas to container on mount / resize
  const fitToContainer = useCallback(() => {
    if (!containerRef.current || !event) return;
    const container = containerRef.current;
    const padding = 80;
    const maxW = container.clientWidth - padding;
    const maxH = container.clientHeight - padding;
    const scaleW = maxW / event.canvas.width;
    const scaleH = maxH / event.canvas.height;
    setScale(Math.min(scaleW, scaleH, 1));
  }, [event]);

  useEffect(() => {
    fitToContainer();
    const observer = new ResizeObserver(fitToContainer);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitToContainer]);

  // Drop element from panel
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('elementType') as ElementType;
      if (!type || !canvasRef.current || !event) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / scale);
      const y = Math.round((e.clientY - rect.top) / scale);
      addElement(type, x, y);
    },
    [scale, event, addElement],
  );

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect if clicking empty canvas area
      if (e.target === canvasRef.current) selectElement(null);
    },
    [selectElement],
  );

  return {
    canvasRef,
    containerRef,
    scale,
    handleCanvasDrop,
    handleCanvasDragOver,
    handleCanvasClick,
  };
}
