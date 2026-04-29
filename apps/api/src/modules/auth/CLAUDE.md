# CLAUDE.md — auth module (backend)

## What this module does
Handles user registration, login, and JWT-based authentication backed by PostgreSQL (via Prisma). Passwords are hashed with bcrypt (12 rounds).

## Key files
| File | Purpose |
|------|---------|
| `auth.module.ts` | NestJS module; registers JwtModule + PassportModule |
| `auth.controller.ts` | POST /register, POST /login, GET /me |
| `auth.service.ts` | Prisma-backed user lookup/creation; bcrypt + JWT signing |
| `strategies/jwt.strategy.ts` | Passport JWT strategy, validates bearer token |
| `guards/jwt-auth.guard.ts` | Use `@UseGuards(JwtAuthGuard)` on protected routes |
| `dto/login.dto.ts` | `RegisterDto` and `LoginDto` with class-validator decorators |

## Data model (Prisma)
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  projects     Project[]
}
```

## API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | None | Create account → returns JWT |
| POST | /api/auth/login | None | Login → returns JWT |
| GET | /api/auth/me | Bearer JWT | Returns current user |

## JWT payload shape
```json
{ "sub": "<userId>", "email": "user@example.com", "name": "Alice" }
```

## Notes
- PrismaService is injected via `@Global() PrismaModule` — no explicit import in auth.module.ts
- Projects/elements routes are currently open (no auth guard); add `@UseGuards(JwtAuthGuard)` to gate by owner
- JWT expiry: 7 days (configured in `auth.module.ts` JwtModule.register)
