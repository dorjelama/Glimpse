'use client';

import { useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useCanvas } from '../hooks/useCanvas';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import type { CanvasElement } from '@/lib/api';
import type { ResizeHandle } from '../types';
import TextElement from './elements/TextElement';
import ImageElement from './elements/ImageElement';
import ShapeElement from './elements/ShapeElement';
import ButtonElement from './elements/ButtonElement';
import DividerElement from './elements/DividerElement';
import GuestNameElement from './elements/GuestNameElement';

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const HANDLE_POSITIONS: Record<ResizeHandle, { top?: string; bottom?: string; left?: string; right?: string; cursor: string }> = {
  nw: { top: '-4px', left: '-4px', cursor: 'nw-resize' },
  n:  { top: '-4px', left: 'calc(50% - 4px)', cursor: 'n-resize' },
  ne: { top: '-4px', right: '-4px', cursor: 'ne-resize' },
  w:  { top: 'calc(50% - 4px)', left: '-4px', cursor: 'w-resize' },
  e:  { top: 'calc(50% - 4px)', right: '-4px', cursor: 'e-resize' },
  sw: { bottom: '-4px', left: '-4px', cursor: 'sw-resize' },
  s:  { bottom: '-4px', left: 'calc(50% - 4px)', cursor: 's-resize' },
  se: { bottom: '-4px', right: '-4px', cursor: 'se-resize' },
};

function ElementWrapper({
  element,
  canvasRef,
  scale,
}: {
  element: CanvasElement;
  canvasRef: React.RefObject<HTMLDivElement>;
  scale: number;
}) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const selectElement = useEditorStore((s) => s.selectElement);
  const updateElement = useEditorStore((s) => s.updateElement);

  const isSelected = selectedId === element.id;
  const { onMouseDown } = useDrag({ element, canvasRef, scale });
  const { onHandleMouseDown } = useResize({ element, scale });

  const inputRef = useRef<HTMLInputElement>(null);

  // Image upload on double-click
  const handleDoubleClick = useCallback(
    async (e: React.MouseEvent) => {
      if (isPreviewMode || element.type !== 'image') return;
      e.stopPropagation();
      inputRef.current?.click();
    },
    [isPreviewMode, element.type],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // For MVP, use local object URL; swap for real upload in production
      const url = URL.createObjectURL(file);
      updateElement(element.id, { src: url, alt: file.name });
      e.target.value = '';
    },
    [element.id, updateElement],
  );

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return <TextElement element={element} isSelected={isSelected} isPreview={isPreviewMode} />;
      case 'image':
        return <ImageElement element={element} />;
      case 'shape':
        return <ShapeElement element={element} />;
      case 'button':
        return <ButtonElement element={element} isPreview={isPreviewMode} />;
      case 'divider':
        return <DividerElement element={element} />;
      case 'guestname':
        return <GuestNameElement element={element} isPreview={isPreviewMode} />;
      default:
        return null;
    }
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => { e.stopPropagation(); if (!isPreviewMode) selectElement(element.id); }}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        cursor: isPreviewMode ? 'default' : 'move',
        userSelect: 'none',
        outline: isSelected && !isPreviewMode ? '2px solid #7c3aed' : 'none',
        outlineOffset: '1px',
      }}
    >
      {renderContent()}

      {/* Hidden file input for image upload */}
      {element.type === 'image' && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}

      {/* Resize handles */}
      {isSelected && !isPreviewMode &&
        HANDLES.map((handle) => (
          <div
            key={handle}
            data-handle={handle}
            onMouseDown={onHandleMouseDown(handle)}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              background: 'white',
              border: '2px solid #7c3aed',
              borderRadius: '2px',
              zIndex: 9999,
              ...HANDLE_POSITIONS[handle],
              cursor: HANDLE_POSITIONS[handle].cursor,
            }}
          />
        ))}
    </div>
  );
}

export default function Canvas() {
  const project = useEditorStore((s) => s.project);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const snapLines = useEditorStore((s) => s.snapLines);

  const {
    canvasRef,
    containerRef,
    scale,
    handleCanvasDrop,
    handleCanvasDragOver,
    handleCanvasClick,
  } = useCanvas();

  if (!project) return null;

  const currentPage = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0];
  if (!currentPage) return null;

  const canvasStyle: React.CSSProperties = {
    width: project.canvas.width,
    height: project.canvas.height,
    backgroundColor: currentPage.backgroundColor,
    backgroundImage: currentPage.backgroundImage
      ? `url(${currentPage.backgroundImage})`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    flexShrink: 0,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
  };

  // Sort current page's elements by zIndex for render order
  const sortedElements = [...currentPage.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto flex items-start justify-center pt-8 pb-16"
      style={{ background: '#e5e7eb' }}
    >
      <div
        ref={canvasRef}
        style={canvasStyle}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
        onClick={handleCanvasClick}
      >
        {sortedElements.map((el) => (
          <ElementWrapper
            key={el.id}
            element={el}
            canvasRef={canvasRef}
            scale={scale}
          />
        ))}

        {/* Smart guide lines — rendered in canvas-space, above all elements */}
        {!isPreviewMode && snapLines.map((line, i) =>
          line.type === 'v' ? (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: line.pos,
                width: 1,
                height: '100%',
                background: '#00d9ff',
                zIndex: 99999,
                pointerEvents: 'none',
                boxShadow: '0 0 4px #00d9ff88',
              }}
            />
          ) : (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: line.pos,
                height: 1,
                width: '100%',
                background: '#00d9ff',
                zIndex: 99999,
                pointerEvents: 'none',
                boxShadow: '0 0 4px #00d9ff88',
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
