# CLAUDE.md — publish module (backend)

## What this module does
Handles the publish/unpublish lifecycle. Publishing generates a unique URL slug (stable across republishes) and sets project status to `published`. Unpublishing reverts to `draft`.

## Key files
| File | Purpose |
|------|---------|
| `publish.module.ts` | NestJS module; imports ProjectsModule |
| `publish.controller.ts` | REST endpoints |
| `publish.service.ts` | Thin async wrapper over ProjectsService |

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/publish/:id | Publish → `{ project, publicUrl }` |
| DELETE | /api/publish/:id | Unpublish (revert to draft) |
| GET | /api/publish/view/:slug | Fetch published project by slug (public viewer) |

## Slug format
`{title-kebab-case}-{6-char-uuid}` — e.g. `my-wedding-invite-a3f9c2`

Slugs are stored as a `@unique` column on the Project table. Republishing reuses the existing slug.

## Notes
- All methods are `async` — they await `ProjectsService` which in turn uses Prisma
- The public viewer at `/view/[slug]` on the frontend calls `GET /api/publish/view/:slug`
- Frontend always calls `saveNow()` before publishing to ensure latest state is persisted
