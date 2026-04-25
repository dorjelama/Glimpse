# Glimpse — Infrastructure Decisions

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
- Transfer nameservers at register.com.np to Cloudflare
- All DNS records (A, CNAME, MX, SPF, DKIM) managed from Cloudflare dashboard
- Route 53 was ruled out: $0.50/month with no advantage over Cloudflare for this setup

**R2 — File Storage**
- Bucket: `glimpse-uploads`
- Storage: $0.015/GB/month
- Egress: **free** — no data transfer costs when guests view cards
- Why not AWS S3: S3 charges $0.09/GB egress; for a card-sharing product where assets are repeatedly fetched by guests, R2's egress-free model gives significantly better unit economics at scale

---

### AWS SES — Email

- Transactional email: signup confirmation, password reset, guest invitations
- Cost: $0.10 per 1,000 emails (~$0.50-5/month at launch scale)
- DNS records (MX, SPF, DKIM, DMARC) configured on Cloudflare for `elegant.com.np`
- No dedicated IP needed at launch; add later if deliverability becomes an issue ($24.95/month)

---

### Vercel — Next.js Frontend

- Plan: Pro ($20/month)
- Hosts `apps/web`
- Custom domain: `glimpse.elegant.com.np` — add CNAME in Cloudflare pointing to Vercel's edge
- Includes: CDN, edge functions, preview deployments per branch, automatic HTTPS

---

### Fly.io — NestJS API

- Hosts `apps/api`
- Custom domain: `api.glimpse.elegant.com.np`
- ~$5-15/month depending on instance size
- Alternative: Railway (slightly simpler DX, similar pricing)

---

### Neon — PostgreSQL

- Serverless Postgres
- Free tier sufficient for launch (500MB, 0.5 vCPU)
- Pro: $19/month when you outgrow the free tier
- Provides a `DATABASE_URL` connection string on creation

---

## Ruled out

| Service | Reason |
|---------|--------|
| AWS S3 | Egress costs add up fast for a photo/card sharing product; R2 is strictly better here |
| AWS Route 53 | $0.50/month hosted zone with no benefit over free Cloudflare DNS |
| AWS EC2 + RDS | More ops overhead than needed at launch; revisit if compliance or VPC isolation is required |
| Self-hosted Postgres | Managed (Neon) is cheaper and lower risk for a small team |

---

## Cost estimate

| Service | Monthly at launch | Monthly at 1K users |
|---------|------------------|---------------------|
| Vercel Pro | $20 | $20 |
| Fly.io (API) | $5-10 | $15-25 |
| Neon (Postgres) | $0 (free tier) | $19 |
| Cloudflare R2 | ~$0.50 | ~$5 |
| AWS SES | ~$0.10 | ~$0.50-5 |
| **Total** | **~$26-31/month** | **~$60-74/month** |

---

## DNS setup checklist

- [ ] Log in to register.com.np and replace nameservers with Cloudflare's two NS records
- [ ] Wait for propagation (up to 48hrs, usually under 2hrs)
- [ ] In Cloudflare, add CNAME: `glimpse` → Vercel deployment URL
- [ ] In Cloudflare, add CNAME: `api.glimpse` → Fly.io app URL
- [ ] Verify Vercel custom domain is confirmed (Vercel dashboard → Domains)
- [ ] Verify Fly.io custom domain is confirmed
- [ ] In AWS SES, start domain verification for `elegant.com.np` and paste the CNAME/TXT records into Cloudflare
- [ ] Confirm SES domain status shows "Verified"
- [ ] Request SES production access (removes sandbox sending limit)

---

## Environment variables added by this infrastructure

| Variable | App | Value source |
|----------|-----|-------------|
| `R2_ACCOUNT_ID` | API | Cloudflare dashboard → R2 |
| `R2_ACCESS_KEY_ID` | API | Cloudflare R2 → API tokens |
| `R2_SECRET_ACCESS_KEY` | API | Cloudflare R2 → API tokens |
| `R2_BUCKET_NAME` | API | `glimpse-uploads` |
| `R2_PUBLIC_URL` | API | Cloudflare R2 bucket public URL |
| `SES_REGION` | API | e.g. `ap-southeast-1` (Singapore, closest to Nepal) |
| `SES_ACCESS_KEY_ID` | API | AWS IAM → SES user |
| `SES_SECRET_ACCESS_KEY` | API | AWS IAM → SES user |
| `SES_FROM_EMAIL` | API | e.g. `hello@elegant.com.np` |
| `NEXT_PUBLIC_APP_URL` | Web | `https://glimpse.elegant.com.np` |
| `NEXT_PUBLIC_API_URL` | Web | `https://api.glimpse.elegant.com.np/api` |
