# Phase 1 — Map of the current imakepage app

Recorded 2026-10-25 from a read-only, logged-in walkthrough (agent account) plus the
public JavaScript bundle the site sends to every browser. Nothing was saved, sent or
changed. No lead/customer personal data is recorded here.

## What it is

A multi-tenant SaaS for real estate agents, teams and home builders. Each paying user
gets a public agent website plus a back office. Marketing pitch: "website, IDX, CRM,
lead inbox, follow-up, reporting, AI content and campaigns in one login."

Pricing seen on the billing page (yearly): Basic $1,070 · Elite $2,690 · VIP $5,390.

## Tech (observed)

- Single-page React app built with Vite, hosted on Replit (Replit dev banner script loads in production).
- One JavaScript file of ~5.3 MB holds the entire app: marketing site, every agent
  website page, the back office, and the platform admin. Public visitors download all of it.
- Maps: Google Maps (places/drawing) on some pages, Mapbox on others.
- Listings: MLS data via a "paragon" endpoint (photos watermarked GPRMLS — Great Plains Regional MLS).
- Payments: Stripe-style checkout/portal sessions.
- AI: blog article generation, testimonial generation, community descriptions, logo
  generation, an AI chat widget, HeyGen avatar videos (admin).
- Tracking: Facebook pixel, its own visitor/session/page analytics.

## Size

- 117 page routes, 185 server API calls.
- Every public page exists twice: `/x` (signed-in user's own site) and `/agent/:slug/x`
  (public). Public sites also resolve to `/site/<uuid>`.

## Screens

### Public agent website (per agent)
Home · Search (map + grid, filters, draw-area, save search) · Property detail ·
Featured listings · Open houses · Recently sold · Communities · Buying · Selling ·
Relocation · Services (5 sub-pages) · Home valuation · Market analysis · Commercial ·
Home builders · Projects / floor plans / site plan / warranty (builder accounts) ·
Gallery (photos, videos) · Testimonials · Blog · About · Agents/Team · Contact ·
Visitor accounts (saved homes, saved searches, personalised search alerts) ·
Privacy, terms, unsubscribe.

### Back office (signed-in agent)
Reached only through a small name dropdown inside the agent's own public website header.
- **Admin Dashboard** (`/admin`), 6 tabs: Overview, Leads, Pipeline, Analytics,
  Properties, Engagement.
- **Edit Templates** (`/user/template-admin`): one ~4,900px-tall page with 16 tabs —
  Themes & Fonts, Content, Social, Hero Layout, Media, Page Layout, Teams,
  SEO & Marketing, Communities, Icons, Navigation & Buttons, Commercial Page, Domains,
  Subscribers, Blog AI, Testimonials AI. Manual "Save Template" button.
- **Email Marketing** (`/user/email`): send a single email or bulk email.
- **Billing & Plans** (`/account/billing`), **User Accounts** (`/account/team`, invite
  up to 5 seats).
- Also: featured listings, communities, social-media settings, guide.

### Platform admin (staff)
User list/stats, toggle accounts/sites, grant free months, video generation.

## Data the server handles (from API names)
Accounts & members/invites · auth · billing/subscriptions · agent template (all site
settings) · leads, engagement-leads, tasks, tour requests, contact messages ·
subscribers & email · saved properties/searches & alerts (site visitors) ·
analytics (sessions, pages, property views, likers) · listings search / MLS lookup ·
communities, districts, neighbourhoods, market insights · blogs, testimonials ·
gallery photos/videos · builder projects, floor plans, plat maps, lots, warranty claims ·
uploads · domains.
