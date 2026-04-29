# CLAUDE.md — apps/web (Next.js frontend)

## What this app does
The Glimpse frontend — a Next.js 14 app with two primary surfaces:
1. **Editor** — drag-and-drop canvas to build and style cards
2. **Viewer** — read-only public page rendered from a published card slug

## Tech stack
- **Framework**: Next.js 14 (App Router, `'use client'` where needed)
- **State**: Zustand + immer (editor store); Zustand persist (auth store)
- **Styling**: Tailwind CSS
- **API client**: `src/lib/api.ts` — thin fetch wrapper around `NEXT_PUBLIC_API_URL`
- **Auth store**: `src/lib/authStore.ts` — Zustand persist, dual-writes token to localStorage + cookie

## Directory layout
```
src/
├── app/                          Next.js App Router pages
│   ├── page.tsx                  Landing page (public marketing page)
│   ├── dashboard/                Authenticated dashboard — lists user's events
│   ├── auth/                     Login + register pages (public)
│   ├── editor/[id]/              Full drag-and-drop editor
│   ├── preview/[id]/             In-editor preview (no editing)
│   ├── settings/                 User profile & account settings
│   └── view/[slug]/              Public viewer — shareable URL (no auth)
├── components/
│   └── UserMenu.tsx              Avatar dropdown: settings + logout
├── lib/
│   ├── api.ts                    API client + shared TypeScript types
│   └── authStore.ts              Zustand auth store with JWT persistence
├── proxy.ts                      Edge proxy: protect all routes except /, /auth/*, /view/*, /g/*
└── modules/
    ├── editor/                   Editor module (see editor/CLAUDE.md)
    ├── preview/                  Preview module (see preview/CLAUDE.md)
    └── publish/                  Publish modal + hook (see publish/CLAUDE.md)
```

## Routes
| Route | Auth required | Description |
|-------|---------------|-------------|
| `/` | No | Public landing / marketing page |
| `/dashboard` | Yes | Dashboard — lists user's Events (Projects), create/delete |
| `/events/[id]` | Yes | Event Hub — shows Card + Moments tiles for a project |
| `/auth/login` | No | Login form |
| `/auth/register` | No | Register form |
| `/editor/[id]` | Yes | Full card editor for event `id` |
| `/preview/[id]` | Yes | Read-only preview of card `id` |
| `/settings` | Yes | User profile: update name, change password, delete account |
| `/view/[slug]` | No | Public card viewer — no auth, fetches by slug |

## Shared types (`src/lib/api.ts`)
All frontend types mirror the backend entities:

| Type | Fields |
|------|--------|
| `GlimpseEvent` | `id`, `title`, `status`, `slug?`, `canvas`, `pages[]`, `createdAt`, `updatedAt` |
| `CanvasElement` | `id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `styles`, `content?`, `src?`, `alt?` |
| `CanvasSettings` | `width`, `height` |
| `Page` | `id`, `name`, `backgroundColor`, `backgroundImage?`, `elements[]` |
| `ElementType` | `'text' \| 'image' \| 'shape' \| 'button' \| 'divider' \| 'guestname' \| 'countdown'` |

## API client (`src/lib/api.ts`)
All calls go to `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`).
Token injected via `Authorization: Bearer <token>` from `authStore`. 401 responses trigger logout + redirect to `/auth/login`.

| Method | Endpoint |
|--------|----------|
| `createEvent` | POST `/events` |
| `listEvents` | GET `/events` |
| `getEvent` | GET `/events/:id` |
| `updateEvent` | PATCH `/events/:id` |
| `deleteEvent` | DELETE `/events/:id` |
| `publishEvent` | POST `/publish/:id` |
| `unpublishEvent` | DELETE `/publish/:id` |
| `getPublished` | GET `/publish/view/:slug` |
| `uploadImage` | POST `/events/:id/upload` (multipart) |

## Auth store (`src/lib/authStore.ts`)
Zustand store with `persist` (localStorage key `glimpse-auth`). On login/register, also writes cookie `glimpse-token` for Next.js Edge middleware.

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

## Future Features

### Projection Mode (Moments)
A full-screen, auto-scrolling view of the live Moments feed designed to be displayed on a venue screen or projector.
- Full-screen layout, large photos, minimal chrome
- Event name + optional branding overlay
- Auto-scroll with configurable speed
- QR code shown periodically so guests can scan and upload
- Route: `/g/[galleryId]/display`
