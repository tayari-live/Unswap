# Deploying UnSwap to Vercel

This app is a Next.js (App Router) project backed by PostgreSQL via Prisma,
NextAuth v5 sessions, Stripe billing, Resend email, and an hourly Vercel Cron.

## 1. Provision a PostgreSQL database

Vercel Postgres, Neon, or Supabase all work. Copy the connection string. For
serverless, prefer the pooled connection URL (e.g. PgBouncer / `?pgbouncer=true`).

## 2. Apply the schema (one-time)

From your machine or a CI step, against the production database:

```bash
DATABASE_URL="<prod-postgres-url>" npx prisma migrate deploy
DATABASE_URL="<prod-postgres-url>" npx prisma db seed   # optional reference data
```

`migrate deploy` applies `prisma/migrations/0_init` and any later migrations. It
never resets data, so it is safe to re-run.

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Required** | PostgreSQL connection string |
| `AUTH_SECRET` | **Required** | `openssl rand -base64 32` — signs NextAuth sessions |
| `AUTH_URL` | **Required** | Production URL, e.g. `https://unswap.net`. Used for email links, sitemap, robots, and Stripe redirects |
| `ENCRYPTION_KEY` | Strongly recommended | Key for AES-256-GCM at-rest encryption of addresses / emergency contacts. Falls back to `AUTH_SECRET`, but **set it explicitly and never change it** — rotating it makes already-encrypted data unreadable |
| `RESEND_API_KEY` | Recommended | Without it, emails only log to the console (no verification, reset, or reminder emails are sent) |
| `EMAIL_FROM` | Recommended | e.g. `UnSwap <hello@unswap.net>` — must be a Resend-verified sending domain |
| `STRIPE_SECRET_KEY` | For real billing | Without it, checkout falls back to dev auto-activation (no charge) |
| `STRIPE_WEBHOOK_SECRET` | For real billing | Signing secret of the `/api/billing/webhook` endpoint |
| `STRIPE_PRICE_LIMITED_1X` | For real billing | Stripe Price ID — Limited 1X tier |
| `STRIPE_PRICE_STANDARD_2X` | For real billing | Stripe Price ID — Standard 2X tier |
| `STRIPE_PRICE_PROFESSIONAL_4X` | For real billing | Stripe Price ID — Professional 4X tier |
| `STRIPE_PRICE_UNLIMITED_PRO` | For real billing | Stripe Price ID — Unlimited Pro tier |
| `STRIPE_PRICE_LIFETIME` | For real billing | Stripe Price ID — Lifetime (one-time payment) |
| `CRON_SECRET` | Recommended | Protects `/api/cron/reminders`; Vercel Cron sends it as `Authorization: Bearer <secret>` |

## 4. Deploy

Connect the GitHub repo (`tayari-org/Unswap_V2`) in Vercel. It builds on every
push to `main`; the Next.js build command and output directory are auto-detected.

## 5. Post-deploy

### Stripe webhook
In the Stripe Dashboard, add an endpoint at:

```
https://<your-domain>/api/billing/webhook
```

Subscribe to checkout / subscription / invoice events, then copy the endpoint's
signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

### Cron schedule
`vercel.json` schedules `/api/cron/reminders` **hourly** (`0 * * * *`), which
runs 48-hour swap reminders, 7-day renewal reminders, and the swap lifecycle
(counter-offer expiry, in-progress / auto-complete transitions).

> **Plan note:** Vercel's Hobby plan allows only **one cron invocation per day**.
> Hourly scheduling requires the **Pro** plan. On Hobby, change the schedule in
> `vercel.json` to e.g. `0 9 * * *` (daily at 09:00 UTC).

## Local development

Local dev also requires PostgreSQL (SQLite is no longer supported). Set
`DATABASE_URL` in `.env` to a local or hosted Postgres instance, then:

```bash
npx prisma migrate deploy   # or: npx prisma db push
npx prisma db seed
npm run dev
```
