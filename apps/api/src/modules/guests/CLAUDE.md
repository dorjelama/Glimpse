# CLAUDE.md — guests module (API)

## What this module does
Manages the guest list for a single event. Guests are named people who receive a personalised shareable link to the published card. Each guest gets a unique UUID token that resolves their name in the public card viewer.

## Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/events/:eventId/guests` | JWT | List all guests for an event (ordered by creation) |
| POST | `/events/:eventId/guests` | JWT | Add a guest (name required, email optional) |
| PATCH | `/events/:eventId/guests/:guestId` | JWT | Update a guest's name or email |
| DELETE | `/events/:eventId/guests/:guestId` | JWT | Remove a guest |
| GET | `/guests/token/:token` | Public | Resolve a guest token → name + eventId (used by public card viewer) |

All routes are under the global `/api` prefix.

## Files
| File | Purpose |
|------|---------|
| `guests.module.ts` | NestJS module wiring |
| `guests.controller.ts` | Route handlers — delegates to service |
| `guests.service.ts` | Business logic + Prisma calls; exports `Guest` interface |
| `dto/create-guest.dto.ts` | Validates name (required) + email (optional) |
| `dto/update-guest.dto.ts` | Validates partial name and/or email for PATCH |

## Key design decisions
- `token` is a UUID generated at creation — unguessable, used in public shareable URLs (`/view/:slug?g=:token`)
- `resolveByToken` returns only `{ name, eventId }` — email and token are never exposed publicly
- Ownership is enforced by combining `eventId` + `guestId` in find queries (not just `guestId`)
- `email` field accepts empty string on update to clear the value (stored as `null`)
- Module is registered in `AppModule`; uses global `PrismaService` (no re-import needed)
