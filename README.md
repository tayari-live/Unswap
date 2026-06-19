# UnSwap — Admin Dashboard

Internal operations console for **UnSwap**, the verified home exchange network
built exclusively for UN and international organisation professionals.

> Independent, staff-led platform. Not affiliated with the United Nations.

Built with the same architecture as the Tayari all-team dashboard: Next.js 16
(App Router), React 19, Prisma, NextAuth v5, Tailwind CSS v4, and Recharts.

## Features

- **Network Overview** — verified members, pending verifications, active
  listings, swaps in progress/completed, open disputes, waitlist size, est. MRR.
- **Verification Queue** — review staff-ID/employment submissions and
  approve/reject with an audited note + member email.
- **Members** — full directory with search/filter; verify, suspend, reinstate,
  and override subscription tiers.
- **Listings** — moderate member homes: flag, pause, archive, restore.
- **Swap Management** — track exchanges across their lifecycle and resolve
  disputes.
- **Waitlist** — referral leaderboard, invite & convert founders, CSV export.
- **Domain Allowlist** — manage approved institutional email domains
  (fast-track vs manual review).
- **Analytics** — signups & swaps over time, verification throughput, tier mix,
  popular duty stations.

## Getting started

```bash
npm install                 # installs deps and runs `prisma generate`
cp .env.example .env        # then set AUTH_SECRET (npx auth secret)
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with the seeded admin:

```
Email:    hello@unswap.net
Password: admin1234
```

## Database

The local default is **SQLite** (`DATABASE_URL="file:./dev.db"`) so the app runs
with zero external setup. To use **Postgres**, change the `datasource` provider
in [`prisma/schema.prisma`](prisma/schema.prisma) to `postgresql` and point
`DATABASE_URL` at your instance, then re-run `prisma migrate dev`.

## Project structure

```
src/
  app/
    (dashboard)/        # admin pages (overview, verification, members, …)
    api/                # route handlers (verification, members, domains, …)
    login/              # auth screen
  components/layout/    # header, sidebar, mobile nav, notification bell
  components/ui/        # shared badges + page header
  server/
    auth.ts             # NextAuth v5 config (credentials)
    http.ts             # ApiError + requireAdmin/requireSession helpers
    services/           # data/business logic per domain
prisma/
  schema.prisma         # data model
  seed.ts               # admin + sample data
```
