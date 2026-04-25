# Glimpse — Pre-Launch Checklist

Everything here must be resolved before the first production deployment. Items are grouped by category and ordered within each group: blockers first, then high-priority, then medium.

Mark each item `[x]` when complete. Leave a note or PR reference next to anything that is deferred with justification.

---

## 1. Legal & Compliance

> Cannot ship without these. Collecting user data and photos without a privacy policy is a legal liability.

- [x] Create `/privacy` page — Privacy Policy (data collected, retention, deletion rights, contact)
- [x] Create `/terms` page — Terms of Service (acceptable use, IP ownership, liability)
- [x] Wire the consent checkbox in the guest upload form ([upload/page.tsx](../apps/web/src/app/g/%5BgalleryId%5D/upload/page.tsx)) to link to `/privacy`
- [ ] Add cookie consent banner on the landing page (GDPR/CCPA requirement for EU/CA visitors)
- [x] Ensure the footer on the landing page links to `/terms` and `/privacy`

---

## 2. Security Hardening

> These are exploit surfaces — not hardening preferences.

- [ ] **Remove hardcoded JWT secret fallbacks** in [jwt.strategy.ts](../apps/api/src/modules/auth/jwt.strategy.ts) and [auth.module.ts](../apps/api/src/modules/auth/auth.module.ts). The app must throw on startup if `JWT_SECRET` is not set — never silently use a default.
- [ ] **Generate a strong production JWT secret**: `openssl rand -hex 32` — store in secrets manager, not in `.env`
- [ ] **Remove hardcoded dev IP** `192.168.1.68` from the CORS allowlist in [main.ts](../apps/api/src/main.ts). Either delete it or gate it behind `NODE_ENV !== 'production'`
- [ ] **Add auth rate limiting** — install `@nestjs/throttler` and apply a limit to `POST /auth/login` and `POST /auth/register` (recommended: 5 attempts per 15 min per IP)
- [ ] **Add Helmet middleware** ([main.ts](../apps/api/src/main.ts)) for security headers: `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`
- [ ] **Lock down Next.js image domains** ([next.config.js](../apps/web/next.config.js)): remove `http://localhost` pattern and replace the wildcard `https://**` with the actual production API/CDN hostname
- [ ] **Verify `.env` files are gitignored** — check `apps/api/.env` and `apps/web/.env.local` are not tracked; rotate any secrets that were previously committed

---

## 3. Environment & Configuration

- [ ] Create `apps/api/.env.example` documenting every required variable:
  ```
  DATABASE_URL=
  PORT=3001
  JWT_SECRET=          # min 64 hex chars — generate with: openssl rand -hex 32
  FRONTEND_URL=
  ADMIN_EMAIL=         # email of the first admin user
  NODE_ENV=production
  ```
- [ ] Create `apps/web/.env.local.example`:
  ```
  NEXT_PUBLIC_API_URL=   # e.g. https://api.yourdomain.com/api
  ```
- [ ] Replace hardcoded `192.168.1.68` in `apps/web/.env.local` with the production API URL
- [ ] Set `NODE_ENV=production` in all production runtime environments (container env, hosting platform)

---

## 4. Infrastructure & Deployment

- [ ] **Create `apps/web/Dockerfile`** — use Next.js `output: 'standalone'` build for a minimal production image
- [ ] **Add `HEALTHCHECK`** to [apps/api/Dockerfile](../apps/api/Dockerfile):
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3001/api/health || exit 1
  ```
- [ ] **Add a non-root user** to `apps/api/Dockerfile` (run as `node` user, not root)
- [ ] **Migrate file uploads off local disk** — local `./uploads/` is ephemeral in any containerised/serverless environment. Integrate Cloudflare R2 (the planned store per CLAUDE.md) or block Moments behind a hard launch date with a named owner assigned.
- [ ] **Define upload expiry/cleanup policy** — per pricing tiers: Pro exports purge after 30 days, Business after 60 days. Implement or document as a follow-up ticket.
- [ ] **Harden `docker-compose.yml`** — move hardcoded PostgreSQL credentials (`glimpse`/`glimpse`) to env vars; do not use the same credentials for production.

---

## 5. Observability

- [ ] **Add `GET /api/health`** liveness endpoint — returns `{ status: 'ok', timestamp: '<ISO>' }` with HTTP 200; no auth required
- [ ] **Add `GET /api/ready`** readiness endpoint — checks DB connectivity (`SELECT 1`) and returns `{ status: 'ready' }` or 503 if the DB is unreachable
- [ ] **Integrate structured logging** (Pino recommended for NestJS) — replace all `console.log` calls; emit JSON logs in production for aggregation (Datadog, Logtail, CloudWatch, etc.)
- [ ] **Wire up error tracking** — add Sentry (or equivalent) to both the API and web app so runtime exceptions surface with stack traces and context

---

## 6. Frontend UX

- [ ] **Add `apps/web/src/app/error.tsx`** — global error boundary; shows a friendly "Something went wrong" page instead of the default Next.js crash screen
- [ ] **Add `apps/web/src/app/not-found.tsx`** — custom 404 page; dead links (especially shared card URLs that have been unpublished) should land here gracefully
- [ ] **Add `og:image`** to the public card view ([view/[slug]/page.tsx](../apps/web/src/app/view/%5Bslug%5D/page.tsx)) — a card without a preview image looks broken when shared on WhatsApp, iMessage, or social
- [ ] **Add `og:image`, `og:url`, and `twitter:image`** to the gallery feed page ([g/[galleryId]/feed/page.tsx](../apps/web/src/app/g/%5BgalleryId%5D/feed/page.tsx))

---

## 7. Testing

- [ ] **Auth flow smoke test** — register a new user, log in, call `GET /auth/me`, verify JWT is returned and decoded correctly
- [ ] **Owner-scoped access control test** — verify User A cannot `PATCH`/`DELETE` User B's event (currently no automated check for this)
- [ ] **Gallery submission E2E test** — submit photos as a guest → host approves → verify submission appears in the feed response
- [ ] **CI pipeline** — add a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs `pnpm lint && pnpm test` on every pull request; block merges on failure

---

## 8. Backend Quality

- [ ] **Add global exception filter** — standardise error response shape and log unhandled exceptions with context (request path, user ID if available)
- [ ] **Add Multer file size limit** in [moments.controller.ts](../apps/api/src/modules/moments/moments.controller.ts) — e.g. `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB); currently uncapped
- [ ] **Set `forbidNonWhitelisted: true`** in `ValidationPipe` config ([main.ts](../apps/api/src/main.ts)) — currently `false`, meaning unknown request fields silently pass through
- [ ] **Add pagination** (`skip`/`take` query params) to `GET /events`, `GET /projects`, and `GET /admin/users` — unbounded list queries will degrade as data grows
- [ ] **Add DB indexes**:
  - `@@index([ownerId, status])` on `Event` model (filtered event lists per user)
  - `@@index([approved])` on `GallerySubmission` model (moderation queue queries)
- [ ] **Document `ADMIN_EMAIL`** in `apps/api/.env.example` — currently undocumented and only present in `.env`

---

## 9. Documentation

- [ ] Create `docs/DEPLOYMENT.md` — step-by-step guide for deploying to production: prerequisites, env vars, Docker build commands, database migration step (`prisma migrate deploy`), smoke test checklist
- [ ] Create `docs/ENVIRONMENT.md` — every env var for both apps, description, whether required or optional, and an example value
- [ ] Add (or update) root `README.md` with a "Deploy to production" section pointing to `docs/DEPLOYMENT.md`

---

## Verification Gates (run before marking launch-ready)

1. `pnpm build` completes with zero TypeScript errors for both apps
2. Full user journey on staging: register → create event → publish → share link → view public card
3. Full guest journey on staging: open gallery → upload photos → host approves → photo appears in live feed
4. `GET /api/health` and `GET /api/ready` return HTTP 200
5. Security headers scan passes at [securityheaders.com](https://securityheaders.com) (minimum grade: B)
6. 5 rapid failed login attempts trigger a 429 response (rate limiter active)
7. Navigate to `/nonexistent-page` — custom 404 page is shown
8. Force a runtime error — Sentry captures it with a stack trace

---

*Last updated: 2026-04-25*
