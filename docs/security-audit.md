# Glimpse — Security Audit
_Last updated: 2026-04-28 — initial audit covering auth, authorization, input handling, CORS, secrets, rate limiting, file uploads, and infrastructure._

## Summary

**Not production-ready as-is.** Three Critical findings (JWT secret fallback, IDOR in events/elements, IDOR in newly-shipped guests module) plus several High-severity gaps must close before launch. The codebase has solid foundations — Helmet + 1y HSTS, Pino with `Authorization` redaction, HTML-escaped email templates, throttled `/auth/*`, Sentry — but multiple owner-scoped paths leak access control and several public endpoints are unrate-limited.

Severity scale: **Critical** (auth bypass / direct data takeover) · **High** (privilege escalation, easy abuse, sensitive token exposure) · **Medium** (defence-in-depth, weakened crypto, hidden client bugs) · **Low** (dev-only or low-yield) · **Informational** (already solid).

---

## Findings

### Critical — fix before any production exposure

| # | Issue | File : line | Impact |
|---|-------|-------------|--------|
| C1 | Hardcoded JWT secret fallback `'glimpse-super-secret-jwt-key-change-in-prod'` | `apps/api/src/modules/auth/auth.module.ts:12`, `apps/api/src/modules/auth/strategies/jwt.strategy.ts:11` | If `JWT_SECRET` is unset in any environment, the app silently signs/verifies tokens with a known, public string — trivial token forgery and full account takeover. |
| C2 | IDOR — events & elements treat `event.ownerId == null` as "anyone can edit" | `apps/api/src/modules/events/events.controller.ts:105, 127, 140, 161, 177, 195`; `apps/api/src/modules/elements/elements.controller.ts:55` | Guard `if (event.ownerId && event.ownerId !== userId)` short-circuits when `ownerId` is null. Any authenticated user can read/mutate/delete those events and their elements. |
| C3 | IDOR — guests module performs **no** ownership check on the parent event | `apps/api/src/modules/guests/guests.controller.ts:23–65` (list/create/update/remove); service only does `findUnique({ where: { id: eventId } })` | Any authenticated user can list, add, edit, or delete guests on **any** event. Personalised invite tokens for other people's events leak. |
| C4 | Hardcoded internal LAN IP in CORS allow-list | `apps/api/src/main.ts:54` (`'http://192.168.1.68:3000'`) | Allows that machine on any reachable network to send credentialed requests to the API in production. |

### High

| # | Issue | File : line | Impact |
|---|-------|-------------|--------|
| H1 | JWT persisted to **both** `localStorage` (Zustand `persist`) and a non-HttpOnly cookie | `apps/web/src/lib/authStore.ts` (persist config + `document.cookie` with no `Secure`, no `HttpOnly`) | Any XSS on the frontend trivially exfiltrates the token. Cookie also lacks `Secure` — leaks over HTTP. |
| H2 | Swagger UI mounted unconditionally | `apps/api/src/main.ts:92` | `/api/docs` served in production, advertising every endpoint and DTO shape. Forces `'unsafe-inline'` in CSP. |
| H3 | Rate limiting only on `/auth/*` (5 / 15min). All public endpoints unthrottled | `apps/api/src/app.module.ts:31–36`. Affected: `POST /gallery/:id/submissions`, `POST /submission/:token/photos`, `GET /guests/token/:token`, `GET /gallery/:id/feed/stream` | Storage exhaustion via 20 MB photo spam, brute-force on guest/submission UUIDs, SSE-connection floods. |
| H4 | No password-reset flow, no email verification at registration | `apps/api/src/modules/auth/*` (absent) | Lost-password users are locked out; unverified email enables impersonation and spam-account creation. |
| H5 | No per-user / per-IP cap on invitation email sends | `apps/api/src/modules/mail/mail.service.ts` (`sendCardInvitation` accepts arbitrary `to: string[]`) | A malicious or compromised account can blast SES with invites — reputation damage, SES throttling, complaints. |

### Medium

| # | Issue | File : line | Notes |
|---|-------|-------------|-------|
| M1 | bcrypt cost factor = 10 | `apps/api/src/modules/auth/auth.service.ts:21, 61` | 2025 baseline is 12. Cheap to bump now; expensive after the user table grows. |
| M2 | `ValidationPipe` runs with `forbidNonWhitelisted: false` | `apps/api/src/main.ts:63` | Extra body fields are silently dropped instead of rejected. Hides client bugs and weakens defence-in-depth. |
| M3 | CSP permits `'unsafe-inline'` for both `script-src` and `style-src` | `apps/api/src/main.ts:25–26` (justified by Swagger UI) | Once H2 is gated, drop `unsafe-inline` in production. |
| M4 | `DELETE /auth/me` relies entirely on Prisma schema cascade | `apps/api/src/modules/auth/auth.service.ts:69` | Verify `onDelete: Cascade` covers Project.owner, Event.owner, Guest.event in the schema. |
| M5 | No JWT rotation / refresh / revocation; tokens valid 7 days | `apps/api/src/modules/auth/auth.module.ts:13` | Stolen token usable for a week; logout cannot revoke. |
| M6 | Reaction rate limiter is in-memory | `apps/api/src/modules/moments/moments.controller.ts:41–61` | Bypassed by horizontal scaling; potential memory leak under attack. |
| M7 | Photo uploads validated by multer `limits.fileSize` + static MIME allow-list only | `apps/api/src/modules/moments/moments.controller.ts:98–104` | Client MIME is forgeable. Sharp does actual HEIC decoding (validates implicitly), but non-HEIC types are not magic-byte checked. |

### Low

| # | Issue | File : line | Notes |
|---|-------|-------------|-------|
| L1 | Default Postgres creds in `docker-compose.yml` (`glimpse:glimpse`); 5432 published to host | `docker-compose.yml:7–10` | Dev only. Prod uses managed DB (Neon) per `docs/INFRASTRUCTURE.md`. |
| L2 | No CAPTCHA on register / login | `apps/api/src/modules/auth/auth.controller.ts:20–60` | Throttling alone permits low-rate credential stuffing. **Resolved** — Cloudflare Turnstile. |

### Informational — already solid

| # | Item | File : line |
|---|------|-------------|
| I1 | Helmet enabled with reasonable CSP, 1-year HSTS, `cross-origin` CORP | `apps/api/src/main.ts:19–48` |
| I2 | Pino logger redacts `req.headers.authorization` | `apps/api/src/app.module.ts:28` |
| I3 | Email templates HTML-escape user input via `escapeHtml()` | `apps/api/src/modules/mail/mail.service.ts:90–91, 212, 240, 249` |
| I4 | Only one raw SQL: parameterless `SELECT 1` health probe | `apps/api/src/modules/health/health.controller.ts:25` |
| I5 | Guest tokens are `uuidv4()`, indexed unique | `apps/api/src/modules/guests/guests.service.ts:48` |
| I6 | Dependencies current (NestJS 10, Next 14, Prisma 5, Helmet 8, bcryptjs 3) | `package.json` files |
| I7 | Sentry initialised before app bootstrap | `apps/api/src/instrument.ts`, `apps/api/src/main.ts:1` |

---

## Fix status

| # | Issue | Status |
|---|-------|--------|
| C1 | JWT secret hardcoded fallback | ✅ Resolved 2026-04-28 — hard-fail at boot if unset |
| C2 | IDOR events/elements null ownerId | ✅ Resolved 2026-04-28 — guard always enforces ownerId match |
| C3 | IDOR guests no ownership check | ✅ Resolved 2026-04-28 — ownership check added to all guarded routes |
| C4 | Hardcoded LAN IP in CORS | ✅ Resolved 2026-04-28 — removed; CORS driven by FRONTEND_URL only |
| H2 | Swagger in production | ✅ Resolved 2026-04-28 — gated behind NODE_ENV !== 'production' |
| H3 | Public endpoints unthrottled | ✅ Resolved 2026-04-28 — 'public' throttle bucket added to guest token resolve and moments upload/submission |
| M1 | bcrypt cost = 10 | ✅ Resolved 2026-04-28 — bumped to 12 |
| M2 | forbidNonWhitelisted false | ✅ Resolved 2026-04-28 — set to true |
| M3 | unsafe-inline CSP | ✅ Resolved 2026-04-28 — dropped in production (Swagger gated) |
| H1 | JWT in localStorage | Open — requires auth flow refactor |
| H4 | No password reset / email verification | Open — next iteration |
| H5 | No invite send rate cap | ✅ Resolved 2026-04-29 — `@Throttle({ public: { limit: 10, ttl: 3600000 } })` on `POST /publish/:id/share` (10 sends/hour per IP, 50 recipients/send max already enforced) |
| M4 | Cascade audit | ✅ Verified 2026-04-28 — all owner chains (Project, Event, Guest, Page, Element, Gallery subtree) have `onDelete: Cascade` |
| M5 | No JWT refresh/revocation | Open — next iteration |
| M6 | In-memory reaction limiter | ✅ Resolved 2026-04-28 — removed; replaced with `@Throttle({ public: { limit: 30, ttl: 60000 } })` |
| M7 | No magic-byte file validation | ✅ Resolved 2026-04-28 — Sharp `.metadata()` validates raster uploads; HEIC validated implicitly by conversion; SVG excluded |
| L1 | Default DB creds in docker-compose | Open (dev only) |
| L2 | No CAPTCHA | ✅ Resolved 2026-04-29 — Cloudflare Turnstile added to register + login (skipped when `TURNSTILE_SECRET_KEY` unset in dev) |

---

## Open questions
- Is the public viewer (`/view/:slug`) ever expected to be indexed by search engines? If yes, add an `X-Robots-Tag` policy decision.
- ~~Multi-instance plan?~~ **Resolved 2026-04-29** — `ThrottlerModule` now uses `RedisThrottlerStorage` (ioredis + Lua atomic increment) when `REDIS_URL` is set; falls back to in-memory when unset (CI/unit tests). Redis added to `docker-compose.yml`. Any future JWT revocation list should use the same Redis instance.
