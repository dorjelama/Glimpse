# CLAUDE.md — apps/api (NestJS backend)

## What this app does
REST API for Glimpse. Handles project CRUD, per-element operations, auth (JWT), and publish/unpublish lifecycle. Persists everything to PostgreSQL via Prisma.

## Swagger / OpenAPI
Interactive API docs are served at **`http://localhost:3001/api/docs`** when the dev server is running.

- Built with `@nestjs/swagger` v7 + `swagger-ui-express`
- Bearer auth scheme configured — click "Authorize" and paste a JWT from POST /api/auth/login
- `persistAuthorization: true` keeps the token across page reloads
- All controllers are tagged; all DTOs have `@ApiProperty` with examples

To regenerate docs: just restart the server — docs are built dynamically from decorators at startup.

## Module map
| Module | Path | Purpose |
|--------|------|---------|
| `prisma` | `src/prisma/` | `@Global` PrismaService — one connection for all modules |
| `auth` | `src/modules/auth/` | Register, login, JWT strategy, `JwtAuthGuard` |
| `projects` | `src/modules/projects/` | Project CRUD + publish/unpublish via ProjectsService |
| `elements` | `src/modules/elements/` | Per-element add/update/delete/reorder (direct Prisma) |
| `publish` | `src/modules/publish/` | Thin wrapper: publish flow + public slug lookup |

## API overview
| Tag | Endpoints |
|-----|-----------|
| Auth | POST /auth/register, POST /auth/login, GET /auth/me |
| Projects | POST /projects, GET /projects, GET/PATCH/DELETE /projects/:id, POST /projects/:id/publish, POST /projects/:id/unpublish |
| Elements | POST/PATCH/DELETE /projects/:id/elements/:eid, POST /projects/:id/elements/:eid/reorder/:dir |
| Publish | POST /publish/:id, DELETE /publish/:id, GET /publish/view/:slug |

All routes are prefixed with `/api` (global prefix set in `main.ts`).

## Entry point
`src/main.ts` — creates NestJS app, sets CORS, ValidationPipe, global `/api` prefix, and mounts Swagger at `/api/docs`.

## Environment
```
DATABASE_URL  postgresql://glimpse:glimpse@localhost:5432/glimpse
PORT          3001
JWT_SECRET    (change in production)
FRONTEND_URL  http://localhost:3000
```

## Startup
```bash
docker-compose up -d                            # start Postgres
npx prisma migrate dev --name init              # first run only
pnpm dev                                        # or from root: pnpm dev:api
```
