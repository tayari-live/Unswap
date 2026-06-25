# Deploying UnSwap to Vercel

This app is a Next.js (App Router) project backed by PostgreSQL via Prisma,
NextAuth v5 sessions, Stripe billing, Resend email, and an hourly Vercel Cron.

## 1. Provision a Neon database

1. Create a project at [neon.tech](https://neon.tech) and a database named `unswap`.
2. From the project dashboard, open **Connection Details** and copy **two** strings:
   - the **Pooled** connection (host contains `-pooler`) → `DATABASE_URL`
   - the **Direct** connection (same host without `-pooler`) → `DIRECT_URL`

   Both include `?sslmode=require`. The pooled URL is used by the app at runtime
   (safe for serverless); the direct URL is used by `prisma migrate`, which can't
   run through the pooler.

The Prisma datasource already reads both:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")  // pooled
  directUrl = env("DIRECT_URL")    // direct, for migrations
}
```

## 2. Apply the schema (one-time)

From your machine or a CI step, against the Neon database. `migrate deploy`
uses `DIRECT_URL` automatically:

```bash
DATABASE_URL="<neon-pooled-url>" DIRECT_URL="<neon-direct-url>" npx prisma migrate deploy
DATABASE_URL="<neon-pooled-url>" DIRECT_URL="<neon-direct-url>" npx prisma db seed   # optional
```

`migrate deploy` applies `prisma/migrations/0_init` and any later migrations. It
never resets data, so it is safe to re-run.

## 3. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Required** | Neon **pooled** connection string (host contains `-pooler`) |
| `DIRECT_URL` | **Required** | Neon **direct** connection string (no `-pooler`) — used by migrations |
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
`vercel.json` schedules `/api/cron/reminders` **daily at 09:00 UTC** (`0 9 * * *`),
which runs 48-hour swap reminders, 7-day renewal reminders, and the swap
lifecycle (counter-offer expiry, in-progress / auto-complete transitions).

> **Plan note:** Vercel's Hobby plan allows only **one cron invocation per day**,
> so the schedule is set to daily. All the reminder/lifecycle jobs query a date
> *range* and are idempotent (guarded by `reminderSentAt` / `renewalReminderSentAt`
> / status), so a once-daily run catches everything without double-sending. On the
> **Pro** plan you can raise the cadence (e.g. `0 * * * *` for hourly) for tighter
> timing on the "48 hours from now" reminder.

## Local development

Local dev also requires PostgreSQL (SQLite is no longer supported). You can use
the same Neon database, or a local Docker Postgres. Set `DATABASE_URL` (and
`DIRECT_URL` for Neon — for a local plain Postgres, point both at the same URL)
in `.env`, then:

```bash
npx prisma migrate deploy   # or: npx prisma db push
npx prisma db seed
npm run dev
```
