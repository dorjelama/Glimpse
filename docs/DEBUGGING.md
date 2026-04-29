# Glimpse — Production Debugging Guide

Quick reference for diagnosing issues on the live stack. Start at the top and work down.

---

## 1. SSH into the server

```bash
ssh -i "path/to/glimpse-key.pem" ubuntu@98.88.106.82
```

The IP `98.88.106.82` is an Elastic IP — it never changes. See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for key file location.

---

## 2. PM2 — API process

```bash
# Is the process running? How many restarts?
pm2 status

# Last 50 lines of all logs
pm2 logs glimpse-api --lines 50

# Errors only
pm2 logs glimpse-api --err --lines 50

# Live CPU + memory dashboard
pm2 monit

# Restart after editing .env
pm2 restart ecosystem.config.js
```

**Log file paths on the server:**
```
/home/ubuntu/.pm2/logs/glimpse-api-out.log   # stdout
/home/ubuntu/.pm2/logs/glimpse-api-error.log # stderr
```

A high restart count (`↺`) in `pm2 status` means the process is crash-looping — check error logs immediately.

---

## 3. Health endpoints

```bash
# Is the API process alive?
curl https://api.glimpse.elegant.com.np/api/health

# Can it reach the database?
curl https://api.glimpse.elegant.com.np/api/ready
```

| Response | Meaning |
|----------|---------|
| `{"status":"ok"}` on `/health` | Process is running |
| `{"status":"ready"}` on `/ready` | Database reachable |
| `503` on `/ready` | Database connection failed |
| Connection refused / timeout | Nginx or PM2 is down |

---

## 4. Nginx logs

```bash
# All incoming requests (live stream)
sudo tail -f /var/log/nginx/access.log

# Upstream errors — 502/504 show here
sudo tail -f /var/log/nginx/error.log

# Test config syntax before applying changes
sudo nginx -t

# Apply config changes without downtime
sudo systemctl reload nginx

# Full restart (avoid if possible)
sudo systemctl restart nginx
```

502 Bad Gateway in Nginx error log = PM2 process is down. Check `pm2 status`.

---

## 5. Application logs (Pino JSON)

Production logs are JSON. Pipe through `jq` to read them:

```bash
# Pretty-print last 100 lines
pm2 logs glimpse-api --lines 100 --nostream | grep '{' | jq .

# Show only errors (level 50 = error, 60 = fatal)
pm2 logs glimpse-api --lines 200 --nostream | grep '{' | jq 'select(.level >= 50)'

# Filter by route
pm2 logs glimpse-api --lines 200 --nostream | grep '{' | jq 'select(.req.url | contains("/auth"))'
```

**Key log fields:**

| Field | Description |
|-------|-------------|
| `level` | 30=info, 40=warn, 50=error, 60=fatal |
| `msg` | Log message |
| `req.url` | Request path |
| `res.statusCode` | HTTP response code |
| `responseTime` | ms taken to respond |
| `context` | NestJS module that logged it |

JWT tokens are automatically redacted from `req.headers.authorization` — never appear in logs.

---

## 6. Database (RDS)

RDS is not publicly accessible. Connect through the EC2 instance via SSH tunnel:

```bash
# Open tunnel from local machine (run this locally, not on the server)
ssh -i "path/to/glimpse-key.pem" -L 5432:glimpse-db.cmz00uk481dc.us-east-1.rds.amazonaws.com:5432 ubuntu@98.88.106.82 -N

# Then in another terminal, connect locally
psql -h localhost -U glimpse -d glimpse
```

**Useful queries:**
```sql
-- Check table row counts
SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
```

**Prisma migration commands (run on the server):**
```bash
cd ~/Glimpse/apps/api

# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Open Prisma Studio (port-forward to use locally)
npx prisma studio
```

---

## 7. Environment variables

```bash
# View current .env on server
cat ~/Glimpse/apps/api/.env

# Confirm what PM2 actually loaded (shows live env for process 0)
pm2 env 0

# After editing .env, always restart
pm2 restart ecosystem.config.js
```

If `pm2 env 0` doesn't show a variable you added to `.env`, the process hasn't restarted yet.

---

## 8. Sentry (when DSN is configured)

Set `SENTRY_DSN` in `~/Glimpse/apps/api/.env` to enable error capture.

- **API errors** are captured automatically via `SentryGlobalFilter` — see [apps/api/src/app.module.ts](../apps/api/src/app.module.ts)
- **Frontend errors** are captured via the error boundary — see [apps/web/src/app/error.tsx](../apps/web/src/app/error.tsx)
- **Sentry config** — see [apps/api/src/instrument.ts](../apps/api/src/instrument.ts)

In production, traces are sampled at 10% (`tracesSampleRate: 0.1`). Error replays capture 100% of sessions with errors.

---

## 9. GitHub Actions deploy logs

1. Go to GitHub repo → **Actions** tab
2. Click the latest **Deploy API** workflow run
3. Expand the **Deploy to EC2** step

The deploy runs: `git pull` → `pnpm install` → `prisma generate` → `prisma migrate deploy` → `pnpm build` → `pm2 restart`

The failed step shows exactly where the deploy broke.

---

## 10. Common issues

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 502 Bad Gateway | PM2 process down | `pm2 status` → check restart count → `pm2 logs --err` |
| 503 on `/api/ready` | RDS unreachable | Check RDS security group allows EC2 on port 5432 |
| Login always fails | CORS mismatch | Confirm `FRONTEND_URL` in `.env` exactly matches the frontend URL (no trailing slash) |
| Emails not sending | SES sandbox mode | Check SES production access approval in AWS console |
| Deploy ran but change not live | Build failed silently | Check GitHub Actions logs for the failed step |
| `.env` change not taking effect | PM2 not restarted | `pm2 restart ecosystem.config.js` |
| `DATABASE_URL not found` error | Typo in `.env` or wrong cwd | `cat .env` and check for typos; confirm `ecosystem.config.js` has correct `cwd` |
| High memory / slow responses | Memory leak or t3.micro limits | `pm2 monit` — watch memory; restart PM2 as temporary fix |
