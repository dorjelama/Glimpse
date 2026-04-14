import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CanvasElement, Page, Project } from '@/lib/api';
import { api } from '@/lib/api';
import { DEFAULT_STYLES, ELEMENT_DEFAULTS, ElementType } from '../types';
import { useStatusStore } from '@/lib/statusStore';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export interface SnapLine {
  type: 'v' | 'h'; // vertical (x=pos) or horizontal (y=pos)
  pos: number;      // canvas-space coordinate
}

interface EditorState {
  project: Project | null;
  currentPageId: string | null;
  selectedId: string | null;
  isPreviewMode: boolean;
  isSaving: boolean;
  saveError: string | null;
  snapLines: SnapLine[];

  // Actions
  loadProject: (id: string) => Promise<void>;
  setProject: (project: Project) => void;
  selectElement: (id: string | null) => void;

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

  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

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
    project: null,
    currentPageId: null,
    selectedId: null,
    isPreviewMode: false,
    isSaving: false,
    saveError: null,
    snapLines: [],

    loadProject: async (id) => {
      const project = await api.getProject(id);
      set((s) => {
        s.project = project;
        s.currentPageId = project.pages[0]?.id ?? null;
      });
    },

    setProject: (project) => {
      set((s) => {
        s.project = project;
        if (!s.currentPageId || !project.pages.find((p) => p.id === s.currentPageId)) {
          s.currentPageId = project.pages[0]?.id ?? null;
        }
      });
    },

    selectElement: (id) => {
      set((s) => { s.selectedId = id; });
    },

    // ── Page actions ──────────────────────────────────────────────────────────

    setCurrentPage: (id) => {
      set((s) => {
        s.currentPageId = id;
        s.selectedId = null;
      });
    },

    addPage: () => {
      set((s) => {
        if (!s.project) return;
        const newPage: Page = {
          id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: `Page ${s.project.pages.length + 1}`,
          order: s.project.pages.length,
          backgroundColor: '#ffffff',
          elements: [],
        };
        s.project.pages.push(newPage);
        s.currentPageId = newPage.id;
        s.selectedId = null;
      });
      get().scheduleSave();
    },

    deletePage: (id) => {
      set((s) => {
        if (!s.project) return;
        if (s.project.pages.length <= 1) return; // must keep at least 1
        const idx = s.project.pages.findIndex((p) => p.id === id);
        if (idx === -1) return;
        s.project.pages.splice(idx, 1);
        // Re-index order values
        s.project.pages.forEach((p, i) => { p.order = i; });
        // Switch to adjacent page
        if (s.currentPageId === id) {
          const nextIdx = Math.min(idx, s.project.pages.length - 1);
          s.currentPageId = s.project.pages[nextIdx]?.id ?? null;
          s.selectedId = null;
        }
      });
      get().scheduleSave();
    },

    renamePage: (id, name) => {
      set((s) => {
        if (!s.project) return;
        const page = s.project.pages.find((p) => p.id === id);
        if (page) page.name = name;
      });
      get().scheduleSave();
    },

    reorderPage: (id, direction) => {
      set((s) => {
        if (!s.project) return;
        const idx = s.project.pages.findIndex((p) => p.id === id);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= s.project.pages.length) return;
        const temp = s.project.pages[idx];
        s.project.pages[idx] = s.project.pages[swapIdx];
        s.project.pages[swapIdx] = temp;
        // Re-index order values
        s.project.pages.forEach((p, i) => { p.order = i; });
      });
      get().scheduleSave();
    },

    // ── Element actions ───────────────────────────────────────────────────────

    addElement: (type, canvasX, canvasY) => {
      const { project, currentPageId } = get();
      if (!project) return;

      const defaults = ELEMENT_DEFAULTS[type];
      const styles = { ...DEFAULT_STYLES[type] };

      const page = project.pages.find((p) => p.id === currentPageId);
      const maxZ = page && page.elements.length
        ? Math.max(...page.elements.map((e) => e.zIndex))
        : 0;

      const x = canvasX ?? Math.round((project.canvas.width - defaults.width) / 2);
      const y = canvasY ?? Math.round((project.canvas.height - defaults.height) / 2);

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
        const pg = s.project!.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        pg.elements.push(newEl);
        s.selectedId = newEl.id;
      });
      get().scheduleSave();
    },

    updateElement: (id, changes) => {
      set((s) => {
        const pg = s.project?.pages.find((p) => p.id === s.currentPageId);
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
        const pg = s.project?.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        pg.elements = pg.elements.filter((e) => e.id !== id);
        if (s.selectedId === id) s.selectedId = null;
      });
      get().scheduleSave();
    },

    duplicateElement: (id) => {
      const { project, currentPageId } = get();
      if (!project) return;
      const page = project.pages.find((p) => p.id === currentPageId);
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
        styles: { ...el.styles },
      };
      set((s) => {
        const pg = s.project!.pages.find((p) => p.id === s.currentPageId);
        if (!pg) return;
        pg.elements.push(copy);
        s.selectedId = copy.id;
      });
      get().scheduleSave();
    },

    bringForward: (id) => {
      set((s) => {
        const pg = s.project?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex += 1;
      });
      get().scheduleSave();
    },

    sendBackward: (id) => {
      set((s) => {
        const pg = s.project?.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = Math.max(1, el.zIndex - 1);
      });
      get().scheduleSave();
    },

    bringToFront: (id) => {
      const { project, currentPageId } = get();
      if (!project) return;
      const page = project.pages.find((p) => p.id === currentPageId);
      if (!page || !page.elements.length) return;
      const maxZ = Math.max(...page.elements.map((e) => e.zIndex));
      set((s) => {
        const pg = s.project!.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = maxZ + 1;
      });
      get().scheduleSave();
    },

    sendToBack: (id) => {
      const { project, currentPageId } = get();
      if (!project) return;
      const page = project.pages.find((p) => p.id === currentPageId);
      if (!page || !page.elements.length) return;
      const minZ = Math.min(...page.elements.map((e) => e.zIndex));
      set((s) => {
        const pg = s.project!.pages.find((p) => p.id === s.currentPageId);
        const el = pg?.elements.find((e) => e.id === id);
        if (el) el.zIndex = Math.max(1, minZ - 1);
      });
      get().scheduleSave();
    },

    updateCanvas: (changes) => {
      set((s) => {
        if (!s.project) return;
        // Dimensions are project-level (shared across pages)
        if (changes.width !== undefined) s.project.canvas.width = changes.width;
        if (changes.height !== undefined) s.project.canvas.height = changes.height;
        // Background is per-page
        const pg = s.project.pages.find((p) => p.id === s.currentPageId);
        if (pg) {
          if (changes.backgroundColor !== undefined) pg.backgroundColor = changes.backgroundColor;
          if ('backgroundImage' in changes) pg.backgroundImage = changes.backgroundImage;
        }
      });
      get().scheduleSave();
    },

    updateTitle: (title) => {
      set((s) => { if (s.project) s.project.title = title; });
      get().scheduleSave();
    },

    updateTransition: (type) => {
      set((s) => { if (s.project) s.project.pageTransition = type; });
      get().scheduleSave();
    },

    saveNow: async () => {
      const project = get().project;
      if (!project) return;
      set((s) => { s.isSaving = true; s.saveError = null; });
      const status = useStatusStore.getState();
      status.loading('Saving…');
      try {
        await api.updateProject(project.id, {
          title: project.title,
          canvas: project.canvas,
          pages: project.pages,
          pageTransition: project.pageTransition,
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
        if (val) s.selectedId = null;
      });
    },

    setSnapLines: (lines) => {
      set((s) => { s.snapLines = lines; });
    },
  })),
);
