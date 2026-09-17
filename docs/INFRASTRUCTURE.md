# Glimpse — Infrastructure Decisions

> ## ⚠️ AWS PRODUCTION WAS TORN DOWN — 2026-09-17
>
> The AWS footprint described below **no longer exists**. It was costing ~$25/month against
> $0.79 of remaining free-plan credits, with the free period ending 2026-10-29.
>
> **Destroyed:** RDS `glimpse-db` (deleted, no final snapshot, no data retained) ·
> EC2 `i-06462bef281be023e` (terminated) · Elastic IP `98.88.106.82` (**released — not
> recoverable**) · EBS `vol-0a3d4b4d5510577eb` (deleted with the instance).
>
> **Still alive:** Cloudflare DNS zone + DKIM records · domain registration · Vercel Hobby
> frontend (will error on every API call until a new backend exists) · SES identity and the
> `glimpse-ses` IAM user.
>
> **No database backup was taken** — this was a deliberate choice. There is no recovery path
> for the production data.
>
> Treat everything below as a historical record of the old setup, not current state.
> Relaunch guidance — on a ~$0–5/month shape rather than this one — is in
> [TEARDOWN.md](TEARDOWN.md).

Decisions made before first production deployment. Covers services chosen, pricing rationale, and what was ruled out and why.

---

## Domain

| Item | Value |
|------|-------|
| Domain | `elegant.com.np` |
| Registrar | [register.com.np](https://register.com.np/) |
| App subdomain | `glimpse.elegant.com.np` |
| API subdomain | `api.glimpse.elegant.com.np` |
| Target market | Nepal only (for now) |

`.com.np` is appropriate for a Nepal-only launch. Revisit the domain if the product expands globally — a `.com` or `.io` will matter for international credibility and SEO.

---

## Services chosen

### Cloudflare — DNS + File Storage

**DNS (free)**
- Nameservers transferred at register.com.np to Cloudflare ✅
- All DNS records (A, CNAME, DKIM) managed from Cloudflare dashboard
- Route 53 was ruled out: $0.50/month with no advantage over Cloudflare for this setup

**R2 — File Storage**
- Bucket: `glimpse-uploads` ✅ created
- Storage: $0.015/GB/month
- Egress: **free** — no data transfer costs when guests view cards
- API token: `glimpse-api` scoped to `glimpse-uploads` bucket

---

### AWS — EC2 + RDS + SES

**Account**: `elegantdecorationsnepal@gmail.com` (new account, free tier active)
**Region**: US East (N. Virginia) for EC2/RDS, Asia Pacific (Singapore) for SES

**EC2 t3.micro — NestJS API** ✅
- Instance: `glimpse-api`
- Elastic IP: `98.88.106.82` (permanent)
- OS: Ubuntu 24.04 LTS
- Stack: Node.js 20 + pnpm + PM2 + Nginx + Certbot
- SSL: Let's Encrypt via Certbot (auto-renews)
- App path: `/home/ubuntu/Glimpse`
- PM2 process: `glimpse-api` (auto-starts on reboot)
- Free tier: 750hrs/month for 12 months

**RDS db.t4g.micro — PostgreSQL** ✅
- Identifier: `glimpse-db`
- Endpoint: `glimpse-db.cmz00uk481dc.us-east-1.rds.amazonaws.com`
- Username: `glimpse`
- Port: 5432
- Database: `glimpse`
- Free tier: 750hrs/month for 12 months

**SES — Email** ✅ (pending domain verification)
- Region: ap-southeast-1 (Singapore)
- Domain: `elegant.com.np` — 3 DKIM CNAME records added to Cloudflare
- IAM user: `glimpse-ses` with AmazonSESFullAccess
- Currently in sandbox mode — request production access before launch
- Cost: $0.10 per 1,000 emails

---

### IAM users (verified 2026-09-17)

| User | Access | Keys | Notes |
|---|---|---|---|
| `glimpse-admin` | AdministratorAccess | none | **Console login** (created 2026-04-29). This is the sign-in account. |
| `glimpse-ses` | AmazonSESFullAccess | 1 active, created 2026-04-29 | Key was stored in the API `.env` on the now-terminated EC2 host. Deactivate if SES is unused. |
| ~~`glimpse-teardown`~~ | ~~AdministratorAccess~~ | deleted | Temporary user created for the 2026-09-17 teardown. Access key deleted; **delete the user object from the console.** |

Account ID: `116715028746`. Billing alarm `glimpse-billing-alert` exists in CloudWatch (free tier
covers the first 10 alarms) — keep it.

---

### Vercel — Next.js Frontend ✅

- Plan: Free (Hobby)
- Hosts `apps/web`
- Custom domain: `glimpse.elegant.com.np` — CNAME in Cloudflare → Vercel
- Upgrade to Pro ($20/month) when going commercial

---

## Ruled out

| Service | Reason |
|---------|--------|
| AWS S3 | Egress costs add up fast for a photo/card sharing product; R2 is strictly better here |
| AWS Route 53 | $0.50/month hosted zone with no benefit over free Cloudflare DNS |
| Azure | Quota issues with new accounts in all nearby regions |
| Fly.io / Railway / Neon | AWS free tier saves ~$34/month for year 1 |

---

## Cost estimate

| Service | Year 1 (free tier) | Year 2+ |
|---------|-------------------|---------|
| EC2 t3.micro | $0 | ~$8/month |
| RDS db.t4g.micro | $0 | ~$15/month |
| Vercel | $0 | $0 (or $20 Pro) |
| Cloudflare R2 | ~$0.50 | ~$5 |
| AWS SES | ~$0.10 | ~$0.50-5 |
| **Total** | **~$1/month** | **~$23-48/month** |

---

## DNS records in Cloudflare

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `api.glimpse` | `98.88.106.82` | DNS only |
| CNAME | `glimpse` | Vercel deployment URL | DNS only |
| CNAME | `vvrfdshdrfeztfpdte37wnnjrb3nk4ml._domainkey` | `vvrfdshdrfeztfpdte37wnnjrb3nk4ml.dkim.amazonses.com` | DNS only |
| CNAME | `dlumz5lm7vnjlbozfiwa6szd4wsdrzs2._domainkey` | `dlumz5lm7vnjlbozfiwa6szd4wsdrzs2.dkim.amazonses.com` | DNS only |
| CNAME | `ktndb35qwaeszw2475o6iem4ld65yhj7._domainkey` | `ktndb35qwaeszw2475o6iem4ld65yhj7.dkim.amazonses.com` | DNS only |

---

## Remaining checklist — VOIDED by the 2026-09-17 teardown

Everything below was true of the old AWS stack. None of it holds now; kept for reference when
rebuilding.

- [x] ~~SES domain verification confirmed~~ — identity still exists, still verified
- [x] ~~Request SES production access submitted~~ — status unknown; re-check before relying on it
- [x] ~~API health endpoint live: `https://api.glimpse.elegant.com.np/api/health`~~ — **dead**,
      the host is terminated and the IP released
- [x] ~~Automated deploys (GitHub Actions → EC2)~~ — **disabled**, push trigger commented out in
      `.github/workflows/deploy-api.yml`
- [x] ~~Admin account registered at `glimpse.elegant.com.np`~~ — **gone with the database**
- [ ] ~~SES production access approved~~
- [ ] ~~Test full login/register + email flow end to end~~
- [ ] ~~Verify editor, preview, publish flow in production~~ — never completed before teardown

## Known issues fixed

- PM2 was crashing due to `OADATABASE_URL` typo in `.env` — fixed, now uses `ecosystem.config.js` with explicit `cwd`
- Next.js 16 async `params` — fixed in all 4 dynamic routes (`events/[id]`, `editor/[id]`, `preview/[id]`, `glimpses/[id]`, `guests/[id]`)
- Next.js 16 `middleware` renamed to `proxy` — fixed export name in `proxy.ts`

---

## Server SSH access

```bash
ssh -i "path/to/glimpse-key.pem" ubuntu@98.88.106.82
```

Key file: `glimpse-key.pem` — store in a safe location, never commit to git.

---

## Environment variables

| Variable | App | Value source |
|----------|-----|-------------|
| `DATABASE_URL` | API | RDS endpoint + glimpse user credentials |
| `JWT_SECRET` | API | Generated with `openssl rand -hex 32` |
| `FRONTEND_URL` | API | `https://glimpse.elegant.com.np` |
| `R2_ACCOUNT_ID` | API | Cloudflare dashboard → R2 |
| `R2_ACCESS_KEY_ID` | API | Cloudflare R2 → API tokens |
| `R2_SECRET_ACCESS_KEY` | API | Cloudflare R2 → API tokens |
| `R2_BUCKET_NAME` | API | `glimpse-uploads` |
| `R2_ENDPOINT` | API | `https://<account-id>.r2.cloudflarestorage.com` |
| `SES_REGION` | API | `ap-southeast-1` |
| `SES_ACCESS_KEY_ID` | API | AWS IAM → glimpse-ses user |
| `SES_SECRET_ACCESS_KEY` | API | AWS IAM → glimpse-ses user |
| `SES_FROM_EMAIL` | API | `hello@elegant.com.np` |
| `NEXT_PUBLIC_APP_URL` | Web | `https://glimpse.elegant.com.np` |
| `NEXT_PUBLIC_API_URL` | Web | `https://api.glimpse.elegant.com.np/api` |
