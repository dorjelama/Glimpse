import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CanvasElement, Page, GlimpseEvent } from '@/lib/api';
import { api } from '@/lib/api';
import { DEFAULT_STYLES, ELEMENT_DEFAULTS, ElementType } from '../types';
import { useStatusStore } from '@/lib/statusStore';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export interface SnapLine {
  type: 'v' | 'h'; // vertical (x=pos) or horizontal (y=pos)
  pos: number;      // canvas-space coordinate
}

/** Strip `_`-prefixed metadata keys from a styles object (used when duplicating). */
function stripMeta(styles: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in styles) {
    if (!key.startsWith('_')) result[key] = styles[key];
  }
  return result;
}

interface EditorState {
  event: GlimpseEvent | null;
  currentPageId: string | null;
  selectedId: string | null;
  /** All currently selected element IDs — may be >1 when Ctrl+clicking or a group is selected. */
  selectedIds: string[];
  isPreviewMode: boolean;
  isSaving: boolean;
  saveError: string | null;
  snapLines: SnapLine[];

  // Actions
  loadEvent: (id: string) => Promise<void>;
  setEvent: (event: GlimpseEvent) => void;
  selectElement: (id: string | null) => void;
  addToSelection: (id: string) => void;

  // Page actions
  setCurrentPage: (id: string) => void;
  addPage: () => void;
  deletePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  reorderPage: (id: string, direction: 'up' | 'down') => void;

  // Element actions (all operate on currentPage.elements)
  addElement: (type: ElementType, canvasX?: number, canvasY?: number) => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  /** Batch-update positions for multiple elements in one store write (used for group drag). */
  batchMove: (updates: { id: string; x: number; y: number }[]) => void;

  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Layers / Lock / Group
  toggleLock: (id: string) => void;
  toggleHidden: (id: string) => void;
  setElementName: (id: string, name: string) => void;
  /** Group all elements currently in selectedIds together. */
  groupSelected: () => void;
  /** Ungroup the group that the given element belongs to. */
  ungroupElement: (id: string) => void;

  // Canvas / title
  updateCanvas: (changes: Partial<{ width: number; height: number; backgroundColor: string; backgroundImage?: string }>) => void;
  updateTitle: (title: string) => void;
  updateTransition: (type: string) => void;

  saveNow: () => Promise<void>;
  scheduleSave: () => void;

  setPreviewMode: (val: boolean) => void;

  // Snap guides (ephemeral drag state — never saved)
  setSnapLines: (lines: SnapLine[]) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    event: null,
    currentPageId: null,
    selectedId: null,
    selectedIds: [],
    isPreviewMode: false,
    isSaving: false,
    saveError: null,
    snapLines: [],

    loadEvent: async (id) => {
      const event = await api.getEvent(id);
      set((s) => {
        s.event = event;
        s.currentPageId = event.pages[0]?.id ?? null;
      });
    },

    setEvent: (event) => {
      set((s) => {
        s.event = event;
        if (!s.currentPageId || !event.pages.find((p) => p.id === s.currentPageId)) {
          s.currentPageId = event.pages[0]?.id ?? null;
        }
      });
    },

    selectElement: (id) => {
      set((s) => {
        s.selectedId = id;
        if (!id) {
          s.selectedIds = [];
          return;
        }
        // If this element belongs to a group, select the whole group
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        const gid = el?.styles?._groupId as string | undefined;
        if (gid) {
          s.selectedIds = (pg?.elements ?? [])
            .filter((e) => (e.styles?._groupId as string | undefined) === gid)
            .map((e) => e.id);
        } else {
          s.selectedIds = [id];
        }
      });
    },

    addToSelection: (id) => {
      set((s) => {
        if (!s.selectedIds.includes(id)) s.selectedIds.push(id);
        s.selectedId = id;
      });
    },

    // ── Page actions ──────────────────────────────────────────────────────────

    setCurrentPage: (id) => {
      set((s) => {
        s.currentPageId = id;
        s.selectedId = null;
        s.selectedIds = [];
      });
    },

    addPage: () => {
      set((s) => {
        if (!s.event) return;
        const newPage: Page = {
          id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: `Page ${s.event.pages.length + 1}`,
          order: s.event.pages.length,
          backgroundColor: '#ffffff',
          elements: [],
        };
        s.event.pages.push(newPage);
        s.currentPageId = newPage.id;
        s.selectedId = null;
        s.selectedIds = [];
      });
      get().scheduleSave();
    },

    deletePage: (id) => {
      set((s) => {
        if (!s.event) return;
        if (s.event.pages.length <= 1) return;
        const idx = s.event.pages.findIndex((p) => p.id === id);
        if (idx === -1) return;
        s.event.pages.splice(idx, 1);
        s.event.pages.forEach((p, i) => { p.order = i; });
        if (s.currentPageId === id) {
          const nextIdx = Math.min(idx, s.event.pages.length - 1);
          s.currentPageId = s.event.pages[nextIdx]?.id ?? null;
          s.selectedId = null;
          s.selectedIds = [];
        }
      });
      get().scheduleSave();
    },

    renamePage: (id, name) => {
      set((s) => {
        if (!s.event) return;
        const page = s.event.pages.find((p) => p.id === id);
        if (page) page.name = name;
      });
      get().scheduleSave();
    },

    reorderPage: (id, direction) => {
      set((s) => {
        if (!s.event) return;
        const idx = s.event.pages.findIndex((p) => p.id === id);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= s.event.pages.length) return;
        const temp = s.event.pages[idx];
        s.event.pages[idx] = s.event.pages[swapIdx];
        s.event.pages[swapIdx] = temp;
        s.event.pages.forEach((p, i) => { p.order = i; });
      });
      get().scheduleSave();
    },

    // ── Element actions ───────────────────────────────────────────────────────

    addElement: (type, canvasX, canvasY) => {
      const { event, currentPageId } = get();
      if (!event) return;

      const defaults = ELEMENT_DEFAULTS[type];
      const styles = { ...DEFAULT_STYLES[type] };

      const page = event.pages.find((p) => p.id === currentPageId);
      const maxZ = page && page.elements.length
        ? Math.max(...page.elements.map((e) => e.zIndex))
        : 0;

      const x = canvasX ?? Math.round((event.canvas.width - defaults.width) / 2);
      const y = canvasY ?? Math.round((event.canvas.height - defaults.height) / 2);

      const newEl: CanvasElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        x,
        y,
        width: defaults.width,
        height: defaults.height,
        zIndex: maxZ + 1,
        styles,
        content: defaults.content,
      };

      set((s) => {
        const pg = s.event!.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        pg.elements.push(newEl);
        s.selectedId = newEl.id;
        s.selectedIds = [newEl.id];
      });
      get().scheduleSave();
    },

    updateElement: (id, changes) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        const idx = pg.elements.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const el = pg.elements[idx];
        pg.elements[idx] = {
          ...el,
          ...changes,
          styles: changes.styles ? { ...el.styles, ...changes.styles } : el.styles,
        };
      });
      get().scheduleSave();
    },

    deleteElement: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        const el = pg.elements.find((e) => e.id === id);
        const gid = el?.styles?._groupId as string | undefined;
        pg.elements = pg.elements.filter((e) => e.id !== id);
        // Disband group when only one member would remain
        if (gid) {
          const remaining = pg.elements.filter(
            (e) => (e.styles?._groupId as string | undefined) === gid,
          );
          if (remaining.length <= 1) {
            for (const e of remaining) {
              const { _groupId, ...rest } = e.styles as any;
              e.styles = rest;
            }
          }
        }
        if (s.selectedId === id) s.selectedId = null;
        s.selectedIds = s.selectedIds.filter((sid) => sid !== id);
      });
      get().scheduleSave();
    },

    duplicateElement: (id) => {
      const { event, currentPageId } = get();
      if (!event) return;
      const page = event.pages.find((p) => p.id === currentPageId);
      if (!page) return;
      const el = page.elements.find((e) => e.id === id);
      if (!el) return;
      const maxZ = page.elements.length ? Math.max(...page.elements.map((e) => e.zIndex)) : 0;
      const copy: CanvasElement = {
        ...el,
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        x: el.x + 20,
        y: el.y + 20,
        zIndex: maxZ + 1,
        // Strip metadata: duplicate is standalone, unlocked, visible
        styles: stripMeta(el.styles),
      };
      set((s) => {
        const pg = s.event!.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        pg.elements.push(copy);
        s.selectedId = copy.id;
        s.selectedIds = [copy.id];
      });
      get().scheduleSave();
    },

    batchMove: (updates) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        for (const { id, x, y } of updates) {
          const el = pg.elements.find((e) => e.id === id);
          if (el) { el.x = x; el.y = y; }
        }
      });
      get().scheduleSave();
    },

    bringForward: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex += 1;
      });
      get().scheduleSave();
    },

    sendBackward: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = Math.max(1, el.zIndex - 1);
      });
      get().scheduleSave();
    },

    bringToFront: (id) => {
      const { event, currentPageId } = get();
      if (!event) return;
      const page = event.pages.find((p) => p.id === currentPageId);
      if (!page || !page.elements.length) return;
      const maxZ = Math.max(...page.elements.map((e) => e.zIndex));
      set((s) => {
        const pg = s.event!.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = maxZ + 1;
      });
      get().scheduleSave();
    },

    sendToBack: (id) => {
      const { event, currentPageId } = get();
      if (!event) return;
      const page = event.pages.find((p) => p.id === currentPageId);
      if (!page || !page.elements.length) return;
      const minZ = Math.min(...page.elements.map((e) => e.zIndex));
      set((s) => {
        const pg = s.event!.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = Math.max(1, minZ - 1);
      });
      get().scheduleSave();
    },

    // ── Layers / Lock / Group ─────────────────────────────────────────────────

    toggleLock: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.styles = { ...el.styles, _locked: !el.styles._locked };
      });
      get().scheduleSave();
    },

    toggleHidden: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.styles = { ...el.styles, _hidden: !el.styles._hidden };
      });
      get().scheduleSave();
    },

    setElementName: (id, name) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) {
          if (name) {
            el.styles = { ...el.styles, _name: name };
          } else {
            const { _name, ...rest } = el.styles as any;
            el.styles = rest;
          }
        }
      });
      get().scheduleSave();
    },

    groupSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.length < 2) return;
      const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        for (const id of s.selectedIds) {
          const el = pg.elements.find((e) => e.id === id);
          if (el) el.styles = { ...el.styles, _groupId: groupId };
        }
      });
      get().scheduleSave();
    },

    ungroupElement: (id) => {
      set((s) => {
        const pg = s.event?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        const el = pg.elements.find((e) => e.id === id);
        const gid = el?.styles?._groupId as string | undefined;
        if (!gid) return;
        for (const e of pg.elements) {
          if ((e.styles?._groupId as string | undefined) === gid) {
            const { _groupId, ...rest } = e.styles as any;
            e.styles = rest;
          }
        }
        // Collapse multi-selection back to the clicked element
        s.selectedIds = s.selectedIds.filter((sid) => {
          const member = pg.elements.find((e) => e.id === sid);
          return !!member;
        });
      });
      get().scheduleSave();
    },

    updateCanvas: (changes) => {
      set((s) => {
        if (!s.event) return;
        if (changes.width !== undefined) s.event.canvas.width = changes.width;
        if (changes.height !== undefined) s.event.canvas.height = changes.height;
        const pg = s.event.pages.find((p) => p.id === s.currentPageId);
        if (pg) {
          if (changes.backgroundColor !== undefined) pg.backgroundColor = changes.backgroundColor;
          if ('backgroundImage' in changes) pg.backgroundImage = changes.backgroundImage;
        }
      });
      get().scheduleSave();
    },

    updateTitle: (title) => {
      set((s) => { if (s.event) s.event.title = title; });
      get().scheduleSave();
    },

    updateTransition: (type) => {
      set((s) => { if (s.event) s.event.pageTransition = type; });
      get().scheduleSave();
    },

    saveNow: async () => {
      const event = get().event;
      if (!event) return;
      set((s) => { s.isSaving = true; s.saveError = null; });
      const status = useStatusStore.getState();
      status.loading('Saving…');
      try {
        await api.updateEvent(event.id, {
          title: event.title,
          canvas: event.canvas,
          pages: event.pages,
          pageTransition: event.pageTransition,
        });
        status.success('All changes saved');
      } catch (e: any) {
        set((s) => { s.saveError = e.message; });
        status.error(`Save failed — ${e.message}`);
      } finally {
        set((s) => { s.isSaving = false; });
      }
    },

    scheduleSave: () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => get().saveNow(), 800);
    },

    setPreviewMode: (val) => {
      set((s) => {
        s.isPreviewMode = val;
        if (val) { s.selectedId = null; s.selectedIds = []; }
      });
    },

    setSnapLines: (lines) => {
      set((s) => { s.snapLines = lines; });
    },
  })),
);
