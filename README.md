# Glimpse — Invitation Builder

A SaaS invitation builder with a drag-and-drop canvas editor, real-time styling, and one-click publishing.

## Monorepo Structure

```
Glimpse/
  apps/
    api/          — NestJS REST API (projects, elements, publish, auth)
      prisma/     — Prisma schema + migrations
      src/
        prisma/   — PrismaService (@Global module)
        modules/  — projects, elements, publish, auth
    web/          — Next.js 14 frontend (editor, preview, public viewer)
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
| Prisma Studio (optional) | `cd apps/api && npx prisma studio` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand + Immer |
| Backend | NestJS, TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (Docker) |
| Package manager | pnpm workspaces |

## Environment Variables

Copy and fill in values:
```bash
cp .env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local   # already committed with defaults
```

Key variables:

| Variable | Where | Default |
|----------|-------|---------|
| `DATABASE_URL` | `apps/api/.env` | `postgresql://glimpse:glimpse@localhost:5432/glimpse` |
| `JWT_SECRET` | `apps/api/.env` | `glimpse-super-secret-...` (change in prod) |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | `http://localhost:3001/api` |

## Database

Schema lives at `apps/api/prisma/schema.prisma`. Three models:

- **User** — email + bcrypt password hash
- **Project** — canvas settings (flat columns), title, status, slug
- **Element** — positioned elements with JSON `styles` column; cascade-deletes with project

Useful commands (run from `apps/api/`):
```bash
npx prisma migrate dev          # apply pending migrations
npx prisma migrate reset        # wipe and re-seed (dev only)
npx prisma studio               # visual DB browser
npx prisma generate             # regenerate client after schema change
```

## Development Phases (implemented)

1. Editor layout shell
2. Schema / data model
3. Add / select / delete elements
4. Drag within canvas bounds
5. Resize with corner handles
6. Property panel (size, position, colors, fonts)
7. Text editing (click-to-edit)
8. Image upload (local object URL)
9. Canvas settings (background, page size)
10. Save / load (Prisma-backed)
11. Preview mode
12. Publish (public slug + viewer)
