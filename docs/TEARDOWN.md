# Glimpse — Production Teardown Runbook

**Goal:** take AWS spend to $0 and get the data off the account before it lapses.
**Status:** NOT EXECUTED. Nothing has been torn down. This is a runbook to be run by hand.
**Date drafted:** 2026-09-17

---

## Cost reality (confirmed from the billing console, 2026-09-17)

This account is on the **credits-based AWS free plan**, not the legacy 750-hours free tier.

| Metric | Value |
|---|---|
| Spend this month | $13.72 |
| Forecast month end | $25.46 |
| Steady state since May 2026 | ~$25/month |
| **Credits remaining** | **$0.79** |
| Free period ends | **2026-10-29** (44 days) |

Largest line items, in order: **RDS** (~half the bill), **EC2 compute**, then EBS/IPv4.

The console states: *"Your access to AWS services will end when credits are depleted or free period
ends."* With $0.79 left, credits are effectively gone. From here the account either converts to
paid billing on your card, or lapses.

**This is why the plan changed:** an RDS snapshot or AMI left in this account is **not an archive**.
It lives on the same account that is about to lapse. Anything you want to keep has to come *off*
AWS — see §0.5. That is the single most time-sensitive step in this document.

---

## Before you start

- [x] `glimpse-key.pem` confirmed present.
- [ ] Confirm no published card URL has been shared with a real guest. Teardown 404s every live link.
- [ ] Run §0.5 **first**, while the instance is still running. Once EC2 is terminated the data is
      only reachable via a snapshot inside a lapsing account.

Requires credentials. This machine has none configured — `aws sts get-caller-identity` fails,
there is no `~/.aws`, and no `AWS_*` env vars. Run `aws configure` first, or use the console.
The §0.5 steps need only SSH and the `.pem`, so they can be done right now.

---

## §0 — Confirm the per-service split (optional, 1 min)

Already known from the console: ~$25/month, RDS largest, EC2 second. Run this only if you want the
exact per-service numbers before deciding what to cut.

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-09-01,End=2026-09-17 \
  --granularity MONTHLY --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE --region us-east-1
```

---

## §0.5 — Get the data OFF AWS (do this FIRST)

Needs only `glimpse-key.pem`. Do this while the EC2 instance is still running — RDS sits in a
security group that generally only admits the app server, so the dump is taken from the server,
not from your laptop.

**1. SSH in:**

```bash
ssh -i "path/to/glimpse-key.pem" ubuntu@98.88.106.82
```

**2. Dump the database** (`DATABASE_URL` is already in the API `.env`):

```bash
cd ~/Glimpse/apps/api
set -a; . ./.env; set +a
pg_dump "$DATABASE_URL" -Fc -f /tmp/glimpse-$(date +%F).dump
ls -lh /tmp/glimpse-*.dump          # sanity-check it is not 0 bytes
```

If `pg_dump` is missing: `sudo apt-get update && sudo apt-get install -y postgresql-client-16`.

**3. Copy it down to your machine**, from a local terminal:

```bash
scp -i "path/to/glimpse-key.pem" \
  ubuntu@98.88.106.82:/tmp/glimpse-*.dump .
```

**4. Also copy the API `.env`** — it holds `JWT_SECRET`, the R2 keys and the SES keys, and
reconstructing it is tedious:

```bash
scp -i "path/to/glimpse-key.pem" \
  ubuntu@98.88.106.82:~/Glimpse/apps/api/.env ./glimpse-api-env.backup
```

> Keep both files outside the repo — `.env` contains live secrets and must never be committed.
> If the account lapses rather than being reused, rotate `JWT_SECRET` and the R2/SES keys on
> relaunch rather than reusing them.

**5. If R2 holds anything you want**, download it before deleting the bucket (see Cloudflare
section) — the same "get it off the platform" logic applies.

Restore later with:

```bash
pg_restore -d "$NEW_DATABASE_URL" --clean --if-exists glimpse-2026-09-17.dump
```

---

## §1 — Find the resource IDs

```bash
aws ec2 describe-instances --region us-east-1 \
  --filters "Name=tag:Name,Values=glimpse-api" \
  --query "Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress]" --output table

aws ec2 describe-addresses --region us-east-1 \
  --query "Addresses[].[PublicIp,AllocationId,InstanceId]" --output table
```

Record the `InstanceId` (`i-…`) and the `AllocationId` (`eipalloc-…`) for `98.88.106.82`.

---

## §2 — RDS: delete (largest year-2 line, ~$15/mo)

Do **not** use `stop-db-instance`. A stopped RDS instance auto-restarts after 7 days and bills
storage the entire time.

If deletion protection is on, clear it first:

```bash
aws rds modify-db-instance --db-instance-identifier glimpse-db \
  --no-deletion-protection --apply-immediately --region us-east-1
```

**If §0.5 succeeded** (you have a verified `.dump` on your own disk), skipping the snapshot is the
right call — snapshot storage keeps billing after deletion, credits are gone, and the snapshot dies
with the account anyway:

```bash
aws rds delete-db-instance --db-instance-identifier glimpse-db \
  --skip-final-snapshot --delete-automated-backups --region us-east-1
```

**If §0.5 failed or you skipped it**, take the snapshot — it is the only remaining copy, and it
buys you until the account lapses on 2026-10-29 to extract the data properly:

```bash
aws rds delete-db-instance --db-instance-identifier glimpse-db \
  --final-db-snapshot-identifier glimpse-db-final-2026-09-17 \
  --region us-east-1
```

Automated backups die with the instance either way. Do not treat a snapshot as an archive — it is
storage inside an account with $0.79 of credits left.

---

## §3 — EC2: terminate (AMI only if relaunching before 2026-10-29)

An AMI captures the configured box — Node 20, pnpm, PM2, Nginx, Certbot, the working
`ecosystem.config.js`. But it is stored *in this account*, so it only helps if you relaunch here
before the account lapses. If the plan is to walk away and rebuild elsewhere later, **skip the AMI**
— it bills EBS snapshot storage against a credit balance of $0.79 and buys nothing.

The server config is reproducible from `docs/INFRASTRUCTURE.md` and the `.env` you pulled in §0.5.

Only if relaunching in-account soon:

```bash
aws ec2 create-image --instance-id i-XXXXXXXX \
  --name "glimpse-api-final-2026-09-17" --region us-east-1
```

Then terminate (wait for the AMI to reach `available` first, if you made one):

```bash
aws ec2 terminate-instances --instance-ids i-XXXXXXXX --region us-east-1
aws ec2 wait instance-terminated --instance-ids i-XXXXXXXX --region us-east-1
```

---

## §4 — Elastic IP: release LAST

Only after the instance reports `terminated`. **`98.88.106.82` is gone permanently once released
and cannot be reclaimed.**

```bash
aws ec2 release-address --allocation-id eipalloc-XXXXXXXX --region us-east-1
```

---

## §5 — Sweep for stragglers

Orphaned EBS volumes survive termination if they were not set to delete-on-terminate:

```bash
aws ec2 describe-volumes --region us-east-1 \
  --filters "Name=status,Values=available" \
  --query "Volumes[].[VolumeId,Size]" --output table
```

Check the SES region too, since resources there are easy to forget:

```bash
aws ec2 describe-instances --region ap-southeast-1 \
  --query "Reservations[].Instances[].[InstanceId,State.Name]" --output table
```

---

## §6 — Budget alarm

Set an AWS Budget at $5 with an email alert, so the next surprise arrives as a notification
rather than a bill. Billing → Budgets → Create budget → Cost budget.

---

## Cloudflare

**Keep the DNS zone and all records for `elegant.com.np`.** DNS is free on every plan.

**Remove the R2 bucket `glimpse-uploads`.** Note it is almost certainly under the 10 GB free tier
and therefore costing ~$0 — deleting it destroys uploaded files for no saving. Proceed only if you
are sure the files are disposable.

1. Dashboard → R2 → `glimpse-uploads` → empty the bucket (must be empty before deletion) → Delete.
2. R2 → API tokens → revoke the `glimpse-api` token.

**Then fix the now-dangling record:** the `api.glimpse` A record points at a released IP. Delete
that single record. Leave the `glimpse` CNAME and the three `_domainkey` DKIM CNAMEs in place.

---

## Explicitly KEEP — free to hold, slow or impossible to rebuild

| Asset | Why keep |
|---|---|
| `elegant.com.np` registration | Paid annually; losing it loses the name |
| Cloudflare DNS zone + DKIM records | Free; DKIM re-verification is slow |
| SES domain identity + `glimpse-ses` IAM user | Free while the account lives; production access is gated on human AWS review. Note it does **not** survive account closure — a new account restarts that queue |
| Vercel Hobby (frontend) | Free and on a separate account; leave it up as a landing surface |
| Local `.dump` + `.env` backup from §0.5 | The only artifacts that survive this account lapsing |

> The frontend at `glimpse.elegant.com.np` stays up but will error on any API call once the
> backend is gone. Consider a maintenance notice if the URL has been shared.

---

## Relaunch path — do not rebuild the same stack

The footprint being torn down cost **~$25/month with no revenue against it**. RDS alone was about
half. Rebuilding it identically recreates the exact problem, so relaunch on the cheap tier instead:

1. **Database** — restore `glimpse-2026-09-17.dump` into a free managed Postgres (Neon or Supabase
   both have usable free tiers) rather than a new RDS instance. This removes the largest line item
   permanently. `pg_restore -d "$NEW_DATABASE_URL" --clean --if-exists glimpse-2026-09-17.dump`
2. **API** — a small always-on host (Fly.io, Render, Railway, or a ~$5 VPS) instead of EC2 + EBS +
   Elastic IP. Rebuild from `docs/INFRASTRUCTURE.md`; the stack is Node 20 + pnpm + PM2 + Nginx +
   Certbot.
3. **Frontend** — Vercel Hobby is already free and untouched. Nothing to do.
4. **DNS** — repoint `api.glimpse` at the new host. The Cloudflare zone and DKIM records are intact.
5. **Secrets** — rebuild `.env` from `glimpse-api-env.backup`, rotating `JWT_SECRET` and the R2/SES
   keys if the old account is being abandoned.
6. Update `docs/INFRASTRUCTURE.md` to match whatever you land on.

Realistic relaunch cost on that shape: **$0–5/month**, versus $25.

---

## The cost vector that actually matters next

**Moments, not compute.** R2 is free to 10 GB and egress-free; one wedding at 3 photos × 150 guests
is already several GB. The 30-day expiry and the Moments-behind-Pro rule are what keep storage from
becoming the next bill — and unlike EC2, that cost scales with usage rather than sitting flat.

Whatever the stack is when it comes back up, set a **billing alert at $5** on day one.
