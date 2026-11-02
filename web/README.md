# imakepage rebuild (version 1)

A rebuild of the imakepage agent platform: a fast public website for each agent, plus a
back office for leads, pipeline, featured listings and website editing.

Background, problems found and design notes are in `../docs/`.

## Run it

Needs Node 24 or newer (it uses Node's built-in SQLite).

```bash
npm install
npm run dev          # http://localhost:3000
```

The database (`data/app.db`) is created automatically on first start, with fictional
sample listings and a demo agent. `npm run reset-db` deletes it so it's rebuilt fresh.

### Demo login (local only)

- Email: `demo@imakepage.test`
- Password: `demo-agent-2026` (override with `DEMO_PASSWORD` before first start)

Demo public site: `/s/jordan-avery`

## Where things are

| Path | What |
|---|---|
| `src/app/page.tsx` | Marketing landing page |
| `src/app/(auth)` | Log in, sign up, log out |
| `src/app/app` | Back office: Today, Leads, Pipeline, Listings, Website editor, Settings |
| `src/app/s/[slug]` | Public agent site: home, search (map), home detail, about, contact |
| `src/app/api/track` | Page-view counter used by public sites |
| `src/lib/db.ts` | SQLite schema and helpers |
| `src/lib/listings.ts` | The listing source: swap this for a real IDX/MLS feed |
| `src/lib/leads.ts` | Leads, history, tasks, outbox |
| `src/lib/sites.ts` | Agent website settings |
| `src/lib/seed.ts` | Sample data (all fictional) |

## Not built yet

Real MLS/IDX feed, real email/SMS sending (replies go to an in-app outbox), payments,
custom domains, teams, builder features, AI writing tools, visitor accounts and saved
searches, hosting.
