# CLAUDE.md — apps/web (Next.js frontend)

## What this app does
The Glimpse frontend — a Next.js 14 app with two primary surfaces:
1. **Editor** — drag-and-drop canvas to build and style invitation cards
2. **Viewer** — read-only public page rendered from a published project slug

## Tech stack
- **Framework**: Next.js 14 (App Router, `'use client'` where needed)
- **State**: Zustand + immer (editor store only)
- **Styling**: Tailwind CSS
- **API client**: `src/lib/api.ts` — thin fetch wrapper around `NEXT_PUBLIC_API_URL`

## Directory layout
```
src/
├── app/                          Next.js App Router pages
│   ├── page.tsx                  Home — "Create New Invitation" button
│   ├── editor/[id]/              Full drag-and-drop editor
│   ├── preview/[id]/             In-editor preview (same project, no editing)
│   └── view/[slug]/              Public viewer — shareable URL
├── lib/
│   └── api.ts                    API client + shared TypeScript types
└── modules/
    ├── editor/                   Editor module (see editor/CLAUDE.md)
    ├── preview/                  Preview module (see preview/CLAUDE.md)
    └── publish/                  Publish modal + hook (see publish/CLAUDE.md)
```

## Routes
| Route | Description |
|-------|-------------|
| `/` | Dashboard — lists all saved projects, create/delete, links to editor |
| `/editor/[id]` | Full editor for project `id` |
| `/preview/[id]` | Read-only preview of project `id` (editor's preview toggle lands here) |
| `/view/[slug]` | Public invitation viewer — no auth, fetches by slug |

## Shared types (`src/lib/api.ts`)
All frontend types mirror the backend entities:

| Type | Fields |
|------|--------|
| `Project` | `id`, `title`, `status`, `slug?`, `canvas`, `elements[]`, `createdAt`, `updatedAt` |
| `CanvasElement` | `id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `styles`, `content?`, `src?`, `alt?` |
| `CanvasSettings` | `width`, `height`, `backgroundColor`, `backgroundImage?` |
| `ElementType` | `'text' \| 'image' \| 'shape' \| 'button' \| 'divider'` |

## API client (`src/lib/api.ts`)
All calls go to `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`).

| Method | Endpoint |
|--------|----------|
| `createProject` | POST `/projects` |
| `listProjects` | GET `/projects` |
| `getProject` | GET `/projects/:id` |
| `updateProject` | PATCH `/projects/:id` |
| `deleteProject` | DELETE `/projects/:id` |
| `publishProject` | POST `/publish/:id` |
| `unpublishProject` | DELETE `/publish/:id` |
| `getPublished` | GET `/publish/view/:slug` |
| `uploadImage` | POST `/projects/:id/upload` (multipart) |

## Environment
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Startup
```bash
pnpm dev        # from repo root — starts both web (3000) and api (3001)
# or
pnpm --filter web dev   # web only (needs API running separately)
```

## Module CLAUDE.md index
Each module has its own detailed CLAUDE.md:
- [`modules/editor/CLAUDE.md`](src/modules/editor/CLAUDE.md) — canvas editor, store, drag/resize hooks
- [`modules/preview/CLAUDE.md`](src/modules/preview/CLAUDE.md) — read-only renderer, public viewer
- [`modules/publish/CLAUDE.md`](src/modules/publish/CLAUDE.md) — publish modal and hook
