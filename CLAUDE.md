# CLAUDE.md — Glimpse Root

## What this project is
Glimpse is a SaaS platform for creating and sharing digital cards. The invitation builder is its MVP feature. Users create cards on a drag-and-drop canvas, style elements, then publish to a shareable public URL.

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
- Canvas settings stored as flat columns on Event (not JSON) — easier to query/index
- Elements stored as a separate `elements` table with FK → Event (cascade delete)
- When frontend sends a full `elements` array via `PATCH /events/:id`, a Prisma transaction deletes-then-recreates all elements atomically
- `PrismaModule` is `@Global()` — `PrismaService` is available in all modules without re-importing
- Auth is JWT with `JwtAuthGuard`; all event/element/publish (write) routes are guarded. `GET /publish/view/:slug` and `GET /guests/token/:token` remain public.
- Account deletion cascades: `onDelete: Cascade` on `Event.owner` — deleting a user removes all their events
- Frontend token: dual-written to Zustand persist (localStorage) and cookie `glimpse-token` (for Edge middleware)
- TypeScript type is `GlimpseEvent` (not `Event`) to avoid conflict with the DOM `Event` interface
- Event IDs use prefix `evt_` (e.g. `evt_a1b2c3d4e5f6`)

## Data flow
```
User action → Zustand store (immer) → 800ms debounce → PATCH /api/events/:id → Prisma transaction → PostgreSQL
```

## Module map
| Path | Purpose |
|------|---------|
| `apps/api/src/prisma` | PrismaService + PrismaModule (@Global) |
| `apps/api/src/modules/projects` | Parent "Event" CRUD (owner-scoped, JWT-guarded) |
| `apps/api/src/modules/events` | Card CRUD (owner-scoped, JWT-guarded) |
| `apps/api/src/modules/elements` | Element add/update/delete/reorder (guarded) |
| `apps/api/src/modules/publish` | Publishing: slug generation, public read |
| `apps/api/src/modules/guests` | Guest list management (guarded); token resolve is public |
| `apps/api/src/modules/auth` | JWT auth (register/login/me update/me delete) |
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

## Design system rule
The visual design system lives at [Design.md](Design.md) at the repo root. **Always read it before doing any UI work** — colors, typography, components, the editorial-vs-workshop zone split, do's and don'ts. New screens, new components, restyles, and any Tailwind-class additions must conform to it. If a UI task requires a token or pattern not in Design.md, propose the addition (and update Design.md) rather than introducing ad-hoc styles.

## Business guardrails (always active)

A business advisor agent is configured at `.claude/agents/business-advisor.md`. Invoke it for any product or feature discussion. Beyond that, apply these rules in every session without being asked:

**Pricing tiers** — Free (card editor, 1 event, no Moments) / Pro (~$15/mo, Moments enabled, 30-day export) / Business (~$49/mo, multiple concurrent galleries, 60-day export). Never give Moments away for free. The card editor is the acquisition hook; Moments is the paid activation.

**Storage cost flag** — Any feature that stores files (photos, exports, assets) must have an expiry or live behind a paid tier. Local disk is temporary; Cloudflare R2 is the planned production store. Always ask: what deletes this, and when?

**Conversion lens** — Every new feature should be evaluated: does it acquire (Free), retain (Pro), or expand (Business)? If it doesn't fit the ladder, it's cost with no return.

When a feature discussion comes up, briefly note its tier fit and any cost exposure before diving into implementation.