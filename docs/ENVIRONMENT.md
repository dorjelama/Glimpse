# Glimpse — Pre-Launch Manual Setup

Everything you personally need to do before the first production deployment.
Code changes are handled separately in the pre-launch checklist; this document covers
accounts, secrets, env vars, and files that cannot be automated.

---

## Step 1 — External accounts to create

### 1a. Sentry (error tracking)
1. Sign up at [sentry.io](https://sentry.io) if you don't have an account.
2. Create **two projects**: one named `glimpse-api` (Platform: Node.js), one named `glimpse-web` (Platform: Next.js).
3. From each project → **Settings → Client Keys (DSN)**, copy the DSN string.
4. You'll paste these into the env vars in Step 3.

### 1b. Production PostgreSQL
Do **not** use the dev Docker Compose credentials (`glimpse`/`glimpse`) in production.
Options:
- **Managed** (recommended): Neon, Supabase, Railway, or AWS RDS. Each gives you a `DATABASE_URL` on creation.
- **Self-hosted**: Run Postgres on your server, create a dedicated user with a strong random password.

### 1c. Cloudflare R2 (when Moments goes live)
Deferred — local disk storage is used until R2 is integrated.
When you're ready: create a Cloudflare account → R2 → new bucket named `glimpse-uploads`.

---

## Step 2 — Secrets to generate

Run these commands **once** and save the output somewhere secure (a password manager or secrets manager like AWS SSM, Doppler, or 1Password Secrets Automation).

```bash
# JWT secret — minimum 64 hex characters (256 bits)
openssl rand -hex 32

# Example output: a3f9c2d1e8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1
```

---

## Step 3 — Environment variables

### API (`apps/api/.env` in dev, container env in production)

| Variable | Required | Description | How to get the value |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | From your managed DB provider, or `postgresql://<user>:<pass>@<host>:5432/glimpse?schema=public` |
| `JWT_SECRET` | ✅ | Signing key for all JWTs | Run `openssl rand -hex 32` (Step 2 above) |
| `FRONTEND_URL` | ✅ | Production frontend origin — used for CORS | e.g. `https://glimpse.app` |
| `NODE_ENV` | ✅ | Must be `production` in production | Hardcode to `production` in your hosting env |
| `PORT` | ✗ | API listen port | Default `3001`. Set if your host requires a different port. |
| `ADMIN_EMAIL` | ✗ | Email address that gets auto-promoted to ADMIN on first login | Your email address |
| `SENTRY_DSN` | ✗ | DSN for the `glimpse-api` Sentry project | From Sentry → glimpse-api → Settings → DSN |

**Production `.env` template** (fill in the blanks, never commit this file):

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/glimpse?schema=public"
JWT_SECRET="<output of openssl rand -hex 32>"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
PORT=3001
ADMIN_EMAIL="your@email.com"
SENTRY_DSN="https://xxx@oXXX.ingest.sentry.io/XXX"
```

---

### Web (`apps/web/.env.local` in dev, platform env in production)

| Variable | Required | Description | How to get the value |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Full URL to the API including `/api` suffix | e.g. `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Frontend origin — used for OG/social share URLs | e.g. `https://yourdomain.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | ✗ | DSN for client-side (browser) errors | From Sentry → glimpse-web → Settings → DSN (same DSN as server) |
| `SENTRY_DSN` | ✗ | DSN for server-side Next.js errors | Same value as `NEXT_PUBLIC_SENTRY_DSN` |
| `SENTRY_AUTH_TOKEN` | ✗ | Enables source map upload in CI for readable stack traces | Sentry → User Settings → Auth Tokens → Create token with `project:releases` scope |
| `SENTRY_ORG` | ✗ | Your Sentry organisation slug | Visible in your Sentry URL: `sentry.io/organizations/<slug>` |
| `SENTRY_PROJECT` | ✗ | Sentry project slug for the web app | `glimpse-web` (or whatever you named it) |

**Production env template** (fill in the blanks):

```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@oXXX.ingest.sentry.io/XXX"
SENTRY_DSN="https://xxx@oXXX.ingest.sentry.io/XXX"
```

CI/CD only (do not put in `.env.local`):
```env
SENTRY_AUTH_TOKEN="sntrys_..."
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="glimpse-web"
```

---

## Step 4 — Files to create manually

### `apps/web/public/og-default.png`

This is the fallback image shown when a Glimpse card or gallery link is shared on
WhatsApp, iMessage, Twitter/X, or Facebook. Without it, social previews will show
a broken image.

**Spec:** 1200 × 630 px, PNG or JPEG, under 1 MB.

**Suggested content:** Glimpse logo centred on a warm cream (`#fdf6e8`) background,
with a short tagline such as "Beautiful digital invitations." Tools: Figma, Canva,
or any image editor.

Place the finished file at: `apps/web/public/og-default.png`

---

## Step 5 — Verify before first deploy

Run through this list in order:

- [ ] `openssl rand -hex 32` output is saved and set as `JWT_SECRET` in production
- [ ] `FRONTEND_URL` in the API env exactly matches the `NEXT_PUBLIC_APP_URL` in the web env (same domain, no trailing slash)
- [ ] `apps/api/.env` is in `.gitignore` — run `git status` and confirm it does not appear
- [ ] `apps/web/.env.local` is in `.gitignore` — same check
- [ ] The hardcoded dev IP `192.168.1.68` has been removed from API CORS and web env (checklist item 2 + 3)
- [ ] The hardcoded JWT secret fallback has been removed from `jwt.strategy.ts` and `auth.module.ts` (checklist item 2)
- [ ] `og-default.png` is present in `apps/web/public/` and is 1200×630 px
- [ ] `GET /api/health` returns `{ "status": "ok" }` after deploy
- [ ] `GET /api/ready` returns `{ "status": "ready" }` after deploy
- [ ] Share a published card link on WhatsApp/iMessage and confirm the OG preview image loads

---

## Step 6 — Database migration on deploy

Every deployment must run migrations before starting the API:

```bash
# Runs pending migrations without prompting (safe for CI/CD)
npx prisma migrate deploy
```

This is already included in `apps/api/Dockerfile` as the container entrypoint.
If you deploy the API without Docker, run this command manually before starting the process.

---

## Quick reference — all env vars at a glance

| Var | App | Prod required |
|---|---|---|
| `DATABASE_URL` | API | ✅ |
| `JWT_SECRET` | API | ✅ |
| `FRONTEND_URL` | API | ✅ |
| `NODE_ENV` | API | ✅ |
| `PORT` | API | ✗ |
| `ADMIN_EMAIL` | API | ✗ |
| `SENTRY_DSN` | API | ✗ |
| `NEXT_PUBLIC_API_URL` | Web | ✅ |
| `NEXT_PUBLIC_APP_URL` | Web | ✅ |
| `NEXT_PUBLIC_SENTRY_DSN` | Web | ✗ |
| `SENTRY_DSN` | Web (server) | ✗ |
| `SENTRY_AUTH_TOKEN` | Web (CI only) | ✗ |
| `SENTRY_ORG` | Web (CI only) | ✗ |
| `SENTRY_PROJECT` | Web (CI only) | ✗ |
