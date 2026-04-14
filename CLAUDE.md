# CLAUDE.md — Glimpse Root

## What this project is
Glimpse is a SaaS invitation builder. Users create invitation cards on a drag-and-drop canvas, style elements, then publish to a shareable public URL.

## Architecture
- **Monorepo** managed with pnpm workspaces
- `apps/api` — NestJS REST backend (port 3001) + Prisma ORM + PostgreSQL
- `apps/web` — Next.js 14 frontend (port 3000)

## Database
- **Engine**: PostgreSQL 16 via Docker (`docker-compose.yml`)
- **ORM**: Prisma 5 — schema at `apps/api/prisma/schema.prisma`
- **PrismaService**: `apps/api/src/prisma/prisma.service.ts` — extends `PrismaClient`, injected globally via `@Global() PrismaModule`
- **Migrations**: `apps/api/prisma/migrations/` — run `npx prisma migrate dev` from `apps/api/`

## Key design decisions
- Canvas settings stored as flat columns on Project (not JSON) — easier to query/index
- Elements stored as a separate `elements` table with FK → Project (cascade delete)
- When frontend sends a full `elements` array via `PATCH /projects/:id`, a Prisma transaction deletes-then-recreates all elements atomically
- `PrismaModule` is `@Global()` — `PrismaService` is available in all modules without re-importing
- Auth is JWT; routes are currently open (no auth guard on projects/elements endpoints) — add `@UseGuards(JwtAuthGuard)` to protect per-user data

## Data flow
```
User action → Zustand store (immer) → 800ms debounce → PATCH /api/projects/:id → Prisma transaction → PostgreSQL
```

## Module map
| Path | Purpose |
|------|---------|
| `apps/api/src/prisma` | PrismaService + PrismaModule (@Global) |
| `apps/api/src/modules/projects` | CRUD for invitation projects |
| `apps/api/src/modules/elements` | Element add/update/delete/reorder (direct Prisma) |
| `apps/api/src/modules/publish` | Publishing: slug generation, public read |
| `apps/api/src/modules/auth` | JWT auth (register/login) |
| `apps/web/src/modules/editor` | Full canvas editor |
| `apps/web/src/modules/preview` | Read-only preview |
| `apps/web/src/modules/publish` | Publish modal + flow |

## Environment variables
```
# apps/api/.env
DATABASE_URL="postgresql://glimpse:glimpse@localhost:5432/glimpse?schema=public"
PORT=3001
JWT_SECRET=change-me-in-production
FRONTEND_URL=http://localhost:3000

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Startup sequence
```bash
docker-compose up -d                           # start Postgres
pnpm install                                   # install all deps
cd apps/api && npx prisma migrate dev --name init  # create tables
cd ../.. && pnpm dev                           # run both apps
```

## CLAUDE.md rule
Every module folder has its own CLAUDE.md. Always update it when adding features. Always update it when debugging as well.
Keep interviewing until we've covered everything.