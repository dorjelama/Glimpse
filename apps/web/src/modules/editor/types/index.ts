export type { CanvasElement, CanvasSettings, ElementType, Project } from '@/lib/api';

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

export interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startElX: number;
  startElY: number;
}

export const DEFAULT_STYLES: Record<string, Record<string, any>> = {
  text: {
    fontSize: '24px',
    fontFamily: 'Georgia, serif',
    fontWeight: '400',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  image: {
    objectFit: 'cover',
    borderRadius: '0px',
  },
  shape: {
    backgroundColor: '#7c3aed',
    borderRadius: '8px',
    opacity: 1,
  },
  divider: {
    backgroundColor: '#d1d5db',
    borderRadius: '2px',
  },
  guestname: {
    fontSize: '32px',
    fontFamily: 'Georgia, serif',
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: '1.3',
  },
  countdown: {
    numberFontSize: '48px',
    labelFontSize: '12px',
    fontFamily: 'Georgia, serif',
    fontWeight: '700',
    numberColor: '#1a1a1a',
    labelColor: '#6b7280',
    boxBackgroundColor: '#f3f0ff',
    boxBorderRadius: '8px',
    gap: '12px',
    showLabels: true,
    opacity: 1,
  },
};

export const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; content?: string }> = {
  text: { width: 320, height: 60, content: 'Your text here' },
  image: { width: 300, height: 300 },
  shape: { width: 200, height: 200 },
  divider: { width: 400, height: 4 },
  guestname: { width: 360, height: 70, content: 'Guest Name' },
  countdown: { width: 480, height: 120, content: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) },
};

export const MIN_SIZE = { width: 40, height: 20 };
