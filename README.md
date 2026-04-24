# Glimpse

Glimpse is an event invitation and live photo-sharing platform. Hosts create a polished digital invitation, publish it to a shareable link, and optionally turn on **Glimpses**: a live gallery where guests scan a QR code, upload photos from their phones, react to posts, and watch an approved feed update in real time.

The product is built as a pnpm monorepo with a Next.js frontend, a NestJS REST API, Prisma, and PostgreSQL.

## Product Overview

- **Digital invitation cards** - drag-and-drop editor, multi-page cards, rich styling, image upload, guest personalization, preview, publish, and public viewing.
- **Event Hub** - one workspace per event with a card tile and a Glimpses gallery tile.
- **Glimpses live gallery** - QR/feed-first guest entry, no guest login, 1-3 photo upload, HEIC conversion, captions, and per-device submission limits.
- **Host moderation** - approve, revoke, bulk approve, delete, pause, reopen, or end a gallery.
- **Live feed** - public timeline with SSE updates, cursor pagination, reactions, own pending submissions, and PWA manifest support.
- **Post-event export** - host ZIP download of approved photos during the export window.
- **Admin surface** - basic user and event management for admins.

## Monorepo Structure

```text
Glimpse/
  apps/
    api/
      prisma/                  Prisma schema and migrations
      src/
        modules/
          auth/                 JWT auth and account management
          projects/             Event Hub parent records
          events/               Invitation card CRUD
          elements/             Canvas element operations
          guests/               Guest list and token resolution
          publish/              Publish/unpublish and public card lookup
          moments/              Glimpses gallery, upload, feed, SSE, export
          admin/                Admin stats and management
    web/
      public/                   Brand assets and app icons
      src/
        app/                    Next.js App Router pages
        components/             Shared shell and status UI
        lib/                    API client and auth/status stores
        modules/                Editor, preview, and publish flows
  docker-compose.yml            Local PostgreSQL
  pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 App Router, React 18, Tailwind CSS, Zustand, Immer |
| Backend | NestJS, TypeScript, Passport JWT, Swagger |
| Database | PostgreSQL 16, Prisma 5 |
| Uploads | Local disk in development, served from `/uploads` |
| Image processing | Sharp for HEIC/HEIF to JPEG conversion |
| Package manager | pnpm workspaces |

## Quick Start

Requirements:

- Node.js 18+
- pnpm 8+
- Docker Desktop or another PostgreSQL 16 instance

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
# apps/web/.env.local is committed with local development defaults

# 4. Apply database migrations
cd apps/api
pnpm prisma:migrate

# 5. Start both apps from the repo root
cd ../..
pnpm dev
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |
| Prisma Studio | `cd apps/api && pnpm prisma:studio` |

## Environment Variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `apps/api/.env` | PostgreSQL connection string |
| `PORT` | `apps/api/.env` | API port, defaults to `3001` |
| `JWT_SECRET` | `apps/api/.env` | JWT signing secret |
| `FRONTEND_URL` | `apps/api/.env` | Allowed frontend CORS origin |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | Browser-facing API base URL |

Default local values are documented in `.env.example` and `apps/api/.env.example`.

## Common Commands

Run these from the repo root unless noted otherwise.

```bash
pnpm dev              # start API and web together
pnpm dev:api          # start NestJS only
pnpm dev:web          # start Next.js only
pnpm build            # build API and web
pnpm build:api
pnpm build:web
```

Database commands:

```bash
cd apps/api
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:studio
```

## Frontend Routes

| Route | Auth | Description |
| --- | --- | --- |
| `/` | No | Public marketing landing page |
| `/auth/login` | No | Sign in |
| `/auth/register` | No | Create account |
| `/dashboard` | Yes | Host dashboard with event list |
| `/events/[id]` | Yes | Event Hub with Card and Glimpses tiles |
| `/events/[id]/glimpses` | Yes | Host moderation and export page |
| `/editor/[id]` | Yes | Drag-and-drop card editor |
| `/preview/[id]` | Yes | Authenticated card preview |
| `/settings` | Yes | Profile and account settings |
| `/view/[slug]` | No | Public published invitation |
| `/g/[galleryId]` | No | Legacy gallery entry redirect |
| `/g/[galleryId]/feed` | No | Public Glimpses live feed |
| `/g/[galleryId]/upload` | No | Guest Glimpses upload form |
| `/g/[galleryId]/pwa-manifest` | No | Per-gallery web app manifest |
| `/admin` | Yes | Admin dashboard |

Protected routes are enforced by Next.js middleware using the `glimpse-token` cookie.

## API Overview

All API routes are prefixed with `/api`. Swagger is available at `/api/docs`.

| Module | Key endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PATCH/DELETE /auth/me` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `POST /projects/:id/gallery` |
| Events | `GET/POST /events`, `GET/PATCH/DELETE /events/:id` |
| Elements | `POST /events/:eventId/elements`, `PATCH/DELETE /events/:eventId/elements/:elementId`, reorder endpoint |
| Publish | `POST /publish/:id`, `DELETE /publish/:id`, `GET /publish/view/:slug` |
| Guests | `GET/POST/DELETE /events/:id/guests`, `GET /guests/token/:token` |
| Gallery | `GET /gallery/:galleryId`, `GET /gallery/:galleryId/feed`, `GET /gallery/:galleryId/feed/stream` |
| Submissions | `POST /gallery/:galleryId/submissions`, upload/finalise/delete by submission token |
| Reactions | `POST /gallery/submission/:submissionId/react` |
| Moderation | `GET /gallery/:galleryId/manage`, approve/delete/open/end/export host routes |
| Admin | Admin stats, users, roles, and event deletion |

Auth-required routes use `Authorization: Bearer <token>`. Public routes include published cards, guest token resolution, gallery info, guest upload, public feed, feed SSE, and reactions.

## Data Model

Core Prisma models:

- `User` - account, profile, and role.
- `Project` - top-level event workspace with title/date, card events, and optional gallery.
- `Event` - invitation card state, publish status, slug, canvas settings, and pages.
- `Page` and `Element` - card canvas content and layout.
- `Guest` - optional guest list with public token resolution.
- `Gallery` - Glimpses gallery state, open/closed/ended lifecycle.
- `GallerySubmission`, `GalleryPhoto`, `SubmissionReaction` - guest posts, uploaded media, and reactions.

## Implemented Highlights

- Responsive public landing page positioning Cards and Glimpses together.
- Authenticated dashboard and Event Hub.
- Template picker and full canvas editor.
- Published public invitation pages.
- Floating guest CTA from invitation card to Glimpses upload when a gallery exists.
- Feed-first QR flow: QR opens `/g/[galleryId]/feed`, upload lives at `/g/[galleryId]/upload`.
- Guest upload with localStorage name restore, HEIC/HEIF conversion, caption, and 3-submission per-device cap.
- Guest self-delete for own pending submissions on the same browser/device token.
- Host moderation with live SSE refresh, mobile-friendly rows, and bulk approve.
- Live public feed with SSE, polling fallback, reactions, cursor pagination, PWA manifest, and add-to-home-screen metadata.
- Gallery lifecycle controls: open, close, end, and ZIP export.

## Notes

- Pricing is not finalized yet; this README describes current product capabilities, not final packaging or plan limits.
- Development uploads are stored in `apps/api/uploads`. Production storage is expected to move to object storage such as Cloudflare R2.
- The current README describes the working monorepo state; product priorities and gaps live in `docs/user-stories.md`.
