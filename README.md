# Glimpse — Invitation Builder

A SaaS invitation builder with a drag-and-drop canvas editor, real-time styling, and one-click publishing to a shareable public URL.

## Monorepo Structure

```
Glimpse/
  apps/
    api/          — NestJS REST API (events, elements, publish, guests, auth)
      prisma/     — Prisma schema + migrations
      src/
        prisma/   — PrismaService (@Global module)
        modules/  — events, elements, publish, guests, auth
    web/          — Next.js 14 frontend (editor, preview, public viewer)
      src/
        app/      — App Router pages (dashboard, editor, auth, settings, view)
        components/ — Shared UI (UserMenu, StatusBar)
        lib/      — API client, authStore, statusStore
        modules/  — editor, preview, publish
  docker-compose.yml
  pnpm-workspace.yaml
```

## Quick Start

```bash
# 1 — Start Postgres via Docker
docker-compose up -d

# 2 — Install all workspace dependencies
pnpm install

# 3 — Run the initial DB migration (creates tables)
cd apps/api
npx prisma migrate dev --name init

# 4 — Back to root and run both apps
cd ../..
pnpm dev
```

| Service | URL |
|---------|-----|
| Next.js frontend | http://localhost:3000 |
| NestJS API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |
| Prisma Studio (optional) | `cd apps/api && npx prisma studio` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand + Immer |
| Backend | NestJS, TypeScript |
| Auth | JWT (PassportJS) — 7-day tokens |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (Docker) |
| Package manager | pnpm workspaces |

## Environment Variables

Copy and fill in values:
```bash
cp .env.example apps/api/.env
# apps/web/.env.local already committed with dev defaults
```

| Variable | Where | Default |
|----------|-------|---------|
| `DATABASE_URL` | `apps/api/.env` | `postgresql://glimpse:glimpse@localhost:5432/glimpse` |
| `JWT_SECRET` | `apps/api/.env` | `change-me-in-production` |
| `FRONTEND_URL` | `apps/api/.env` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | `http://localhost:3001/api` |

## Database

Schema lives at `apps/api/prisma/schema.prisma`. Four models:

- **User** — email + bcrypt password hash (10 rounds)
- **Event** — canvas settings (flat columns), title, status, slug, owner FK (cascade-delete)
- **Page** — one or more pages per event; each has a background colour/image + elements
- **Element** — positioned canvas elements with JSON `styles` column; cascade-deletes with page
- **Guest** — optional guest list per event; resolved via a shareable token

Useful commands (run from `apps/api/`):
```bash
npx prisma migrate dev          # apply pending migrations
npx prisma migrate reset        # wipe and re-seed (dev only)
npx prisma studio               # visual DB browser
npx prisma generate             # regenerate client after schema change
```

## API Overview

All routes are prefixed `/api`. Interactive docs at `/api/docs`.

| Tag | Endpoints |
|-----|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`, `DELETE /auth/me` |
| Events | `POST /events`, `GET /events`, `GET/PATCH/DELETE /events/:id` |
| Elements | `POST/PATCH/DELETE /events/:id/elements/:eid` |
| Publish | `POST /publish/:id`, `DELETE /publish/:id`, `GET /publish/view/:slug` (public) |
| Guests | `GET/POST/DELETE /events/:id/guests`, `GET /guests/token/:token` (public) |

Auth-required routes send `Authorization: Bearer <token>`. Public routes: `GET /publish/view/:slug` and `GET /guests/token/:token`.

## Frontend Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Yes | Dashboard — all your events |
| `/auth/login` | No | Sign in |
| `/auth/register` | No | Create account |
| `/editor/[id]` | Yes | Drag-and-drop canvas editor |
| `/preview/[id]` | Yes | Read-only preview |
| `/settings` | Yes | Update name, change password, delete account |
| `/view/[slug]` | No | Public shareable invitation |

Unauthenticated requests to protected routes are redirected to `/auth/login` by Next.js Edge middleware.

## Features Implemented

- Drag-and-drop canvas editor with element types: text, image, shape, button, divider, guest name, countdown
- Multi-page invitations with page transitions (fade, slide, flip)
- Per-element properties: position, size, font, colour, opacity, border radius, layer order, lock, hide
- Smart snap guides while dragging
- Group / ungroup elements
- Image upload (local object URL synced on save)
- Google Fonts picker (50+ fonts, loaded on demand)
- Auto-save with 800 ms debounce
- Publish to a unique public slug; unpublish at any time
- Guest list management with personalised shareable links
- Countdown element (live timer to a target date)
- Full JWT auth: register, login, logout, update profile, delete account
- Account deletion cascades and removes all events
