# CLAUDE.md — editor module (frontend)

## What this module does
The full drag-and-drop card editor. Manages a canvas with positioned elements, selection, drag, resize, inline text editing, image upload, layer ordering, and auto-save.

## Component tree
```
EditorLayout          ← loads project, keyboard shortcuts, wires layout
  Toolbar             ← title edit, preview toggle, save, publish
  ElementsPanel       ← element type buttons (drag or click to add)
  Canvas              ← main interactive surface
    ElementWrapper[]  ← per-element: drag, resize handles, click-to-select
      TextElement       ← contentEditable inline editing
      ImageElement      ← img or upload placeholder
      ShapeElement      ← styled div
      ButtonElement     ← styled div
      DividerElement    ← styled div
      GuestNameElement  ← personalised guest name placeholder
      CountdownElement  ← live countdown to a target date (ticks every second)
  PropertiesPanel     ← position/size/style controls for selected element, canvas settings
```

## Key files
| File | Purpose |
|------|---------|
| `components/EditorLayout.tsx` | Top-level shell: loads project, keyboard delete |
| `components/Canvas.tsx` | Renders all elements, handles drop from panel |
| `components/Toolbar.tsx` | Top bar: title, save status, preview, publish |
| `components/ElementsPanel.tsx` | Left panel: element type tiles, draggable |
| `components/PropertiesPanel.tsx` | Right panel: style controls, layer buttons |
| `components/elements/*.tsx` | Individual element renderers |
| `hooks/useCanvas.ts` | Canvas scale, drop handler, fit-to-container |
| `hooks/useDrag.ts` | Pointer-based drag within canvas bounds (mouse + touch + pen) |
| `hooks/useResize.ts` | 8-handle resize with min/max constraints (pointer events) |
| `store/editorStore.ts` | Zustand + immer store — all editor state |
| `types/index.ts` | Shared types, DEFAULT_STYLES, ELEMENT_DEFAULTS |

## State management
All editor state lives in `editorStore` (Zustand + immer):
- `project` — full project with elements and canvas settings
- `selectedId` — currently selected element ID (or null)
- `isPreviewMode` — read-only preview overlay
- `isSaving` / `saveError` — auto-save debounce (800ms)

## Data flow
```
User action → store mutation (immer) → scheduleSave() → 800ms debounce → PATCH /api/projects/:id
```

## Canvas coordinate system
- Elements use absolute positioning within the canvas div (px units)
- Canvas is scaled via CSS `transform: scale(N)` to fit the viewport
- All drag/resize math divides mouse deltas by `scale` to stay in canvas-space

## Font system
50+ Google Fonts are available for text and button elements. The system loads fonts on demand so nothing is fetched on page load.

| File | Purpose |
|------|---------|
| `constants/fonts.ts` | `FontOption` interface, `FONT_CATEGORIES` array, `FONTS` registry (50+ entries) |
| `utils/loadFont.ts` | `loadGoogleFont(googleName)` — injects a single `<link>` tag; `loadGoogleFontBatch(names[])` — one request for many fonts |
| `components/FontPicker.tsx` | Searchable dropdown; groups fonts by category; each option renders in its own face; portals into `document.body` to avoid `overflow` clipping |

**How a font is stored:** `element.styles.fontFamily` holds the full CSS value with fallback, e.g. `"'Playfair Display', serif"`. `TextElement` and `ButtonElement` already spread `...element.styles`, so the face applies automatically.

**Adding a new font:** append an entry to `FONTS` in `constants/fonts.ts` with `family` (CSS value + fallback), `label`, `googleName` (exact Google Fonts name), and `category`.

## Countdown element
`CountdownElement` renders a live days/hours/minutes/seconds timer. The target date is stored as an ISO-8601 string in `element.content` (e.g. `"2026-12-31T23:59"`). All visual options are in `element.styles`:

| Style key | Default | Description |
|-----------|---------|-------------|
| `numberFontSize` | `'48px'` | Font size for the digit figures |
| `labelFontSize` | `'12px'` | Font size for "Days / Hours / Minutes / Seconds" labels |
| `fontFamily` | `'Georgia, serif'` | Font for all text |
| `fontWeight` | `'700'` | Weight for digit figures |
| `numberColor` | `'#1a1a1a'` | Color of the digits |
| `labelColor` | `'#6b7280'` | Color of the labels |
| `boxBackgroundColor` | `'#f3f0ff'` | Background fill of each digit box |
| `boxBorderRadius` | `'8px'` | Corner radius of each box |
| `gap` | `'12px'` | Gap between the four boxes |
| `showLabels` | `true` | Toggle label row visibility |
| `opacity` | `1` | Overall element opacity |

All of these are editable in `PropertiesPanel` when a countdown element is selected.
