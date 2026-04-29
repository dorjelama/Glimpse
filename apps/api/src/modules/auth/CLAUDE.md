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
  id                     String    @id @default(uuid())
  email                  String    @unique
  passwordHash           String
  name                   String
  role                   UserRole  @default(USER)
  emailVerified          Boolean   @default(false)
  emailVerificationToken String?   @unique
  passwordResetToken     String?   @unique
  passwordResetExpiresAt DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

## API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | None | Create account → returns JWT + sends verification email |
| POST | /api/auth/login | None | Login → returns JWT |
| GET | /api/auth/me | Bearer JWT | Returns current user (fresh DB read, includes emailVerified) |
| PATCH | /api/auth/me | Bearer JWT | Update name or password |
| DELETE | /api/auth/me | Bearer JWT | Delete account |
| POST | /api/auth/forgot-password | None | Send password reset email (silent if email not found) |
| POST | /api/auth/reset-password | None | Reset password with token (expires 1 hour) |
| POST | /api/auth/verify-email | None | Mark email as verified using token from email |

## JWT payload shape
```json
{ "sub": "<userId>", "email": "user@example.com", "name": "Alice" }
```

## Notes
- PrismaService is injected via `@Global() PrismaModule` — no explicit import in auth.module.ts
- Projects/elements routes are currently open (no auth guard); add `@UseGuards(JwtAuthGuard)` to gate by owner
- JWT expiry: 7 days (configured in `auth.module.ts` JwtModule.register)
