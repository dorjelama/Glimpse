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
import CountdownElement from './elements/CountdownElement';

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

// Stable group-indicator colours keyed by a simple hash of groupId
const GROUP_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#db2777'];
function groupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) hash = (hash * 31 + groupId.charCodeAt(i)) & 0xffff;
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

function ElementWrapper({
  element,
  canvasRef,
  scale,
}: {
  element: CanvasElement;
  canvasRef: React.RefObject<HTMLDivElement>;
  scale: number;
}) {
  const selectedIds    = useEditorStore((s) => s.selectedIds);
  const isPreviewMode  = useEditorStore((s) => s.isPreviewMode);
  const selectElement  = useEditorStore((s) => s.selectElement);
  const addToSelection = useEditorStore((s) => s.addToSelection);
  const updateElement  = useEditorStore((s) => s.updateElement);

  const isSelected = selectedIds.includes(element.id);
  const isLocked   = !!element.styles?._locked;
  const groupId    = element.styles?._groupId as string | undefined;

  const { onMouseDown } = useDrag({ element, canvasRef, scale });
  const { onHandleMouseDown } = useResize({ element, scale });

  const inputRef = useRef<HTMLInputElement>(null);

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
      const url = URL.createObjectURL(file);
      updateElement(element.id, { src: url, alt: file.name });
      e.target.value = '';
    },
    [element.id, updateElement],
  );

  const renderContent = () => {
    switch (element.type) {
      case 'text':      return <TextElement element={element} isSelected={isSelected} isPreview={isPreviewMode} />;
      case 'image':     return <ImageElement element={element} />;
      case 'shape':     return <ShapeElement element={element} />;
      case 'button':    return <ButtonElement element={element} isPreview={isPreviewMode} />;
      case 'divider':   return <DividerElement element={element} />;
      case 'guestname': return <GuestNameElement element={element} isPreview={isPreviewMode} />;
      case 'countdown': return <CountdownElement element={element} />;
      default:          return null;
    }
  };

  // Locked elements: render visually but block all canvas interaction
  if (isLocked && !isPreviewMode) {
    return (
      <div
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
          pointerEvents: 'none',
        }}
      >
        {renderContent()}
        {/* Lock badge */}
        <div
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            fontSize: '9px',
            lineHeight: 1,
            background: 'rgba(0,0,0,0.55)',
            color: '#fbbf24',
            borderRadius: '3px',
            padding: '2px 4px',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          🔒
        </div>
      </div>
    );
  }

  // Outline colour: group colour when part of a group, accent purple otherwise
  const outlineColor = groupId ? groupColor(groupId) : '#7c3aed';

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPreviewMode) {
          if (e.ctrlKey || e.metaKey) addToSelection(element.id);
          else selectElement(element.id);
        }
      }}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        cursor: isPreviewMode ? 'default' : 'move',
        userSelect: 'none',
        outline: isSelected && !isPreviewMode ? `2px solid ${outlineColor}` : 'none',
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
              border: `2px solid ${outlineColor}`,
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
  const event         = useEditorStore((s) => s.event);
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const snapLines     = useEditorStore((s) => s.snapLines);

  const {
    canvasRef,
    containerRef,
    scale,
    handleCanvasDrop,
    handleCanvasDragOver,
    handleCanvasClick,
  } = useCanvas();

  if (!event) return null;

  const currentPage = event.pages.find((p) => p.id === currentPageId) ?? event.pages[0];
  if (!currentPage) return null;

  const bgRotation = currentPage.backgroundImageRotation ?? 0;
  const userScale = currentPage.backgroundImageScale ?? 1;
  const needsBgScale = bgRotation === 90 || bgRotation === 270;
  const rotationScale = needsBgScale
    ? Math.max(event.canvas.width, event.canvas.height) / Math.min(event.canvas.width, event.canvas.height)
    : 1;
  const bgScale = rotationScale * userScale;

  const canvasStyle: React.CSSProperties = {
    width: event.canvas.width,
    height: event.canvas.height,
    backgroundColor: currentPage.backgroundColor,
    position: 'relative',
    overflow: 'hidden',
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    flexShrink: 0,
    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
  };

  // Hidden elements are excluded from the canvas render (editor-only toggle)
  const sortedElements = [...currentPage.elements]
    .filter((el) => !el.styles?._hidden)
    .sort((a, b) => a.zIndex - b.zIndex);

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
        {/* Background image layer — rendered as <img> so CSS rotate works */}
        {currentPage.backgroundImage && (
          <img
            src={currentPage.backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translate(-50%, -50%) rotate(${bgRotation}deg) scale(${bgScale})`,
              transformOrigin: 'center center',
              zIndex: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}

        {sortedElements.map((el) => (
          <ElementWrapper
            key={el.id}
            element={el}
            canvasRef={canvasRef}
            scale={scale}
          />
        ))}

        {/* Smart guide lines */}
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
