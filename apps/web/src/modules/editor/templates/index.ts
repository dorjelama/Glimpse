import type { CanvasElement, Page } from '@/lib/api';

export interface CardTemplate {
  id: string;
  name: string;
  /** Thumbnail background for the picker preview */
  previewBg: string;
  /** Thumbnail accent color for the fake "title bar" in preview */
  previewAccent: string;
  pages: TemplatePageDef[];
}

export interface TemplatePageDef {
  backgroundColor: string;
  elements: Omit<CanvasElement, 'id'>[];
}

// Canvas is 1080 × 1920. All x/y/width/height values are in canvas-space px.

export const TEMPLATES: CardTemplate[] = [
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    previewBg: '#1a1230',
    previewAccent: '#c4a35a',
    pages: [
      {
        backgroundColor: '#1a1230',
        elements: [
          {
            type: 'text',
            x: 140, y: 620, width: 800, height: 120,
            zIndex: 1,
            styles: { fontSize: '72px', fontFamily: 'Georgia, serif', fontWeight: '700', color: '#ffffff', textAlign: 'center', lineHeight: '1.2' },
            content: 'Your Event Title',
          },
          {
            type: 'text',
            x: 290, y: 780, width: 500, height: 60,
            zIndex: 2,
            styles: { fontSize: '32px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#c4a35a', textAlign: 'center', lineHeight: '1.4' },
            content: 'Date · Venue',
          },
          {
            type: 'divider',
            x: 390, y: 900, width: 300, height: 2,
            zIndex: 3,
            styles: { backgroundColor: '#c4a35a', borderRadius: '2px' },
          },
          {
            type: 'guestname',
            x: 290, y: 960, width: 500, height: 70,
            zIndex: 4,
            styles: { fontSize: '36px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#e8e0f8', textAlign: 'center', lineHeight: '1.3' },
            content: 'Guest Name',
          },
        ],
      },
    ],
  },

  {
    id: 'cream-classic',
    name: 'Cream Classic',
    previewBg: '#fdf6ec',
    previewAccent: '#1a1a2e',
    pages: [
      {
        backgroundColor: '#fdf6ec',
        elements: [
          {
            type: 'text',
            x: 140, y: 600, width: 800, height: 120,
            zIndex: 1,
            styles: { fontSize: '72px', fontFamily: 'Georgia, serif', fontWeight: '700', color: '#1a1a2e', textAlign: 'center', lineHeight: '1.2' },
            content: 'You Are Invited',
          },
          {
            type: 'divider',
            x: 440, y: 770, width: 200, height: 2,
            zIndex: 2,
            styles: { backgroundColor: '#c4a35a', borderRadius: '2px' },
          },
          {
            type: 'text',
            x: 290, y: 820, width: 500, height: 60,
            zIndex: 3,
            styles: { fontSize: '30px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#6b5c3e', textAlign: 'center', lineHeight: '1.4' },
            content: 'Date · Time · Venue',
          },
          {
            type: 'guestname',
            x: 290, y: 960, width: 500, height: 70,
            zIndex: 4,
            styles: { fontSize: '36px', fontFamily: 'Georgia, serif', fontWeight: '600', color: '#1a1a2e', textAlign: 'center', lineHeight: '1.3' },
            content: 'Guest Name',
          },
        ],
      },
    ],
  },

  {
    id: 'modern-bold',
    name: 'Modern Bold',
    previewBg: '#f5f5f5',
    previewAccent: '#7c3aed',
    pages: [
      {
        backgroundColor: '#f5f5f5',
        elements: [
          {
            type: 'shape',
            x: 0, y: 0, width: 1080, height: 480,
            zIndex: 1,
            styles: { backgroundColor: '#1a1230', borderRadius: '0px', opacity: 1 },
          },
          {
            type: 'text',
            x: 80, y: 160, width: 920, height: 180,
            zIndex: 2,
            styles: { fontSize: '84px', fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontWeight: '900', color: '#ffffff', textAlign: 'left', lineHeight: '1.1' },
            content: 'Big Day.',
          },
          {
            type: 'text',
            x: 80, y: 360, width: 700, height: 60,
            zIndex: 3,
            styles: { fontSize: '28px', fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontWeight: '400', color: '#c4a35a', textAlign: 'left', lineHeight: '1.4' },
            content: 'Date · Venue',
          },
          {
            type: 'shape',
            x: 80, y: 560, width: 80, height: 8,
            zIndex: 4,
            styles: { backgroundColor: '#7c3aed', borderRadius: '4px', opacity: 1 },
          },
          {
            type: 'guestname',
            x: 80, y: 640, width: 600, height: 70,
            zIndex: 5,
            styles: { fontSize: '36px', fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontWeight: '600', color: '#1a1230', textAlign: 'left', lineHeight: '1.3' },
            content: 'Guest Name',
          },
        ],
      },
    ],
  },

  {
    id: 'blush-soft',
    name: 'Blush Soft',
    previewBg: '#fff0f3',
    previewAccent: '#8b3a4a',
    pages: [
      {
        backgroundColor: '#fff0f3',
        elements: [
          {
            type: 'text',
            x: 140, y: 580, width: 800, height: 120,
            zIndex: 1,
            styles: { fontSize: '68px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#8b3a4a', textAlign: 'center', lineHeight: '1.2', fontStyle: 'italic' },
            content: 'Join Us',
          },
          {
            type: 'text',
            x: 290, y: 740, width: 500, height: 60,
            zIndex: 2,
            styles: { fontSize: '28px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#6b5c3e', textAlign: 'center', lineHeight: '1.4' },
            content: 'Date · Time · Venue',
          },
          {
            type: 'divider',
            x: 390, y: 850, width: 300, height: 1,
            zIndex: 3,
            styles: { backgroundColor: '#e8a0b0', borderRadius: '2px' },
          },
          {
            type: 'guestname',
            x: 290, y: 910, width: 500, height: 70,
            zIndex: 4,
            styles: { fontSize: '36px', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#8b3a4a', textAlign: 'center', lineHeight: '1.3', fontStyle: 'italic' },
            content: 'Guest Name',
          },
        ],
      },
    ],
  },
];
