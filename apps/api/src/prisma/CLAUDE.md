# CLAUDE.md — prisma infrastructure (backend)

## What this folder does
Provides the shared `PrismaService` and `PrismaModule` that give every NestJS module access to the Prisma Client.

## Key files
| File | Purpose |
|------|---------|
| `prisma.service.ts` | Extends `PrismaClient`; calls `$connect` on init and `$disconnect` on destroy |
| `prisma.module.ts` | `@Global()` NestJS module — import once in `AppModule`, available everywhere |

## Why @Global
Rather than importing `PrismaModule` in every feature module, `@Global()` registers `PrismaService` in the root injector. All modules can inject `PrismaService` without explicitly importing `PrismaModule`.

## Schema location
`apps/api/prisma/schema.prisma` — Prisma schema with `User`, `Project`, `Element` models.

## Common Prisma commands (run from `apps/api/`)
```bash
npx prisma migrate dev --name <description>   # create + apply migration
npx prisma migrate deploy                      # apply in production
npx prisma generate                            # regenerate @prisma/client
npx prisma studio                              # visual DB browser (localhost:5555)
npx prisma db seed                             # run seed script (add to package.json)
```

## Connection
`DATABASE_URL` from `.env` — defaults to `postgresql://glimpse:glimpse@localhost:5432/glimpse?schema=public` (matches docker-compose.yml).
