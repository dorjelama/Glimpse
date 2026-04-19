import { useCallback, useRef } from 'react';
import { useEditorStore, type SnapLine } from '../store/editorStore';
import type { CanvasElement } from '@/lib/api';

const SNAP_THRESHOLD = 6; // canvas-space pixels

interface UseDragOptions {
  element: CanvasElement;
  canvasRef: React.RefObject<HTMLDivElement>;
  scale: number;
}

// ─── Snap helpers ─────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; width: number; height: number }

function xAnchors(r: Rect) {
  return [r.x, r.x + r.width / 2, r.x + r.width];
}
function yAnchors(r: Rect) {
  return [r.y, r.y + r.height / 2, r.y + r.height];
}

function computeSnap(
  dragged: Rect,
  refs: Rect[],
  canvas: { width: number; height: number },
): { snappedX: number; snappedY: number; lines: SnapLine[] } {
  const refXs: number[] = [0, canvas.width / 2, canvas.width];
  const refYs: number[] = [0, canvas.height / 2, canvas.height];
  for (const r of refs) {
    refXs.push(...xAnchors(r));
    refYs.push(...yAnchors(r));
  }

  const dragXs = xAnchors(dragged);
  const dragYs = yAnchors(dragged);

  let bestXDelta = Infinity;
  let bestXLine: number | null = null;
  let snappedX = dragged.x;

  for (const dragAnchor of dragXs) {
    for (const ref of refXs) {
      const delta = ref - dragAnchor;
      if (Math.abs(delta) < SNAP_THRESHOLD && Math.abs(delta) < Math.abs(bestXDelta)) {
        bestXDelta = delta;
        bestXLine = ref;
      }
    }
  }
  if (bestXLine !== null) snappedX = dragged.x + bestXDelta;

  let bestYDelta = Infinity;
  let bestYLine: number | null = null;
  let snappedY = dragged.y;

  for (const dragAnchor of dragYs) {
    for (const ref of refYs) {
      const delta = ref - dragAnchor;
      if (Math.abs(delta) < SNAP_THRESHOLD && Math.abs(delta) < Math.abs(bestYDelta)) {
        bestYDelta = delta;
        bestYLine = ref;
      }
    }
  }
  if (bestYLine !== null) snappedY = dragged.y + bestYDelta;

  const lines: SnapLine[] = [];
  if (bestXLine !== null) lines.push({ type: 'v', pos: bestXLine });
  if (bestYLine !== null) lines.push({ type: 'h', pos: bestYLine });

  return { snappedX, snappedY, lines };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDrag({ element, canvasRef, scale }: UseDragOptions) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const batchMove     = useEditorStore((s) => s.batchMove);
  const selectElement = useEditorStore((s) => s.selectElement);
  const setSnapLines  = useEditorStore((s) => s.setSnapLines);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const event         = useEditorStore((s) => s.event);
  const currentPageId = useEditorStore((s) => s.currentPageId);

  const dragRef = useRef({
    active: false,
    startMouseX: 0,
    startMouseY: 0,
    startElX: 0,
    startElY: 0,
    /** Start positions of other group members captured at drag start. */
    groupMemberStarts: [] as { id: string; x: number; y: number; width: number; height: number }[],
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPreviewMode) return;
      if ((e.target as HTMLElement).dataset.handle) return;
      // Ignore non-primary mouse buttons; accept all touch/pen.
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();
      selectElement(element.id);

      const pointerId = e.pointerId;
      const targetEl = e.currentTarget as HTMLElement;
      // Keep receiving move/up events even if the finger slides off this element.
      try { targetEl.setPointerCapture(pointerId); } catch {}

      const d = dragRef.current;
      d.active = true;
      d.startMouseX = e.clientX;
      d.startMouseY = e.clientY;
      d.startElX = element.x;
      d.startElY = element.y;

      // Capture group member start positions so we can move the whole group together
      const groupId = element.styles?._groupId as string | undefined;
      if (groupId && event) {
        const page = event.pages.find((p) => p.id === currentPageId);
        d.groupMemberStarts = (page?.elements ?? [])
          .filter(
            (e) =>
              (e.styles?._groupId as string | undefined) === groupId &&
              e.id !== element.id &&
              !e.styles?._locked,
          )
          .map((e) => ({ id: e.id, x: e.x, y: e.y, width: e.width, height: e.height }));
      } else {
        d.groupMemberStarts = [];
      }

      const onMove = (me: PointerEvent) => {
        if (!d.active || !event) return;
        if (me.pointerId !== pointerId) return;

        const dx = (me.clientX - d.startMouseX) / scale;
        const dy = (me.clientY - d.startMouseY) / scale;

        const rawX = Math.max(0, Math.min(d.startElX + dx, event.canvas.width  - element.width));
        const rawY = Math.max(0, Math.min(d.startElY + dy, event.canvas.height - element.height));

        const page = event.pages.find((p) => p.id === currentPageId);
        const others = (page?.elements ?? []).filter((e) => e.id !== element.id);

        const { snappedX, snappedY, lines } = computeSnap(
          { x: rawX, y: rawY, width: element.width, height: element.height },
          others,
          event.canvas,
        );

        setSnapLines(lines);

        if (d.groupMemberStarts.length > 0) {
          // Move all group members by the same actual delta as the lead element
          const actualDx = snappedX - d.startElX;
          const actualDy = snappedY - d.startElY;
          const memberUpdates = d.groupMemberStarts.map((m) => ({
            id: m.id,
            x: Math.round(Math.max(0, Math.min(m.x + actualDx, event.canvas.width  - m.width))),
            y: Math.round(Math.max(0, Math.min(m.y + actualDy, event.canvas.height - m.height))),
          }));
          batchMove([
            { id: element.id, x: Math.round(snappedX), y: Math.round(snappedY) },
            ...memberUpdates,
          ]);
        } else {
          updateElement(element.id, {
            x: Math.round(snappedX),
            y: Math.round(snappedY),
          });
        }
      };

      const onUp = (me: PointerEvent) => {
        if (me.pointerId !== pointerId) return;
        d.active = false;
        d.groupMemberStarts = [];
        setSnapLines([]);
        try { targetEl.releasePointerCapture(pointerId); } catch {}
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [element, scale, event, currentPageId, updateElement, batchMove, selectElement, setSnapLines, isPreviewMode],
  );

  return { onPointerDown };
}
