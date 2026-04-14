# CLAUDE.md — preview module (frontend)

## What this module does
Read-only rendering of an invitation project. Used in two contexts:
1. **In-editor preview** — editor's "Preview" toggle disables editing and shows the final look
2. **Public viewer** — `/view/[slug]` page renders a published invitation for anyone with the link

## Component tree
```
PreviewLayout      ← thin header (back to editor button / published badge)
  PreviewCanvas    ← scales and renders all elements, pointer-events disabled
    TextElement    ← isPreview=true (no contentEditable)
    ImageElement
    ShapeElement
    ButtonElement  ← isPreview=true (shows pointer cursor)
    DividerElement
```

## Key files
| File | Purpose |
|------|---------|
| `components/PreviewLayout.tsx` | Shell with header; accepts `isPublicView` prop to hide editor link |
| `components/PreviewCanvas.tsx` | Canvas rendering identical to editor but fully non-interactive |

## Data models used
`Project` from `@/lib/api` — same shape as editor. No mutations in preview.

## Routes
| Route | Source |
|-------|--------|
| `/preview/[id]` | Fetches project by ID from API |
| `/view/[slug]` | Fetches published project by slug via `GET /api/publish/view/:slug` |

## Mobile responsiveness
Invitations are primarily shared and opened on mobile browsers. `PreviewCanvas` handles this with:

- **Scale logic** (`fitToContainer`): on viewports `< 640px` wide, scales to fit width only (no height constraint) so text stays readable and the user scrolls vertically for tall canvases. On desktop, fits both axes with no scroll.
- **Layout wrapper**: the canvas is wrapped in a div sized to `canvas.width * scale` × `canvas.height * scale`. This is required because CSS `transform: scale()` doesn't affect layout flow — without the wrapper the full unscaled div would overflow and cause a horizontal scrollbar.
- **`transformOrigin: top left`**: matches the wrapper's top-left anchor so the scaled canvas aligns flush.
- **`h-[100dvh]`** in `PreviewLayout`: uses the dynamic viewport height unit so the shell doesn't overflow when the mobile browser chrome (address bar) slides in or out.
- **Viewport meta**: `apps/web/src/app/layout.tsx` exports a `viewport` with `width=device-width, initialScale=1` via Next.js 14's `Viewport` export.
