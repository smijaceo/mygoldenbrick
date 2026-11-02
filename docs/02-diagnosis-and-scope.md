# Phase 2 — What's wrong, and what version 1 fixes

## Problems found (ranked by how much they hurt users)

1. **No real back office.** The agent's tools live inside their own public website,
   behind a small name dropdown. `/dashboard` just shows the public homepage. There is no
   sidebar, no "what needs my attention today" view.
2. **The site editor is one giant form.** 16 tabs on one ~4,900px page. Related settings
   are split up (hero text is edited in both "Content" and "Hero Layout"; the video
   showcase sits under "Social"). The "live preview" is a fake mini card, not the real
   site. Changes need a manual Save, with nothing warning you about unsaved work.
3. **Leads and pipeline don't connect.** The pipeline is a read-only row of counters
   with the text "go to the Leads tab to update a lead's status". You can't drag a lead
   to the next stage.
4. **The same numbers appear in 4 places** (Overview, Analytics, Properties,
   Engagement), sometimes disagreeing (2 visitors vs. 3 devices).
5. **Fake activity.** The Overview's activity feed shows "Welcome email sent to new
   subscriber" while the subscriber count is 0. This undermines trust in every number.
6. **Heavy, slow app.** One 5.3 MB JavaScript file holds everything, including admin
   code, and every public visitor downloads it. Bad for phones and Google ranking.
7. **Listing data bugs.** Addresses repeat the city/ZIP twice ("Omaha NE 68152, Omaha,
   NE 68152"); "Listing Agent: 1876" shows an ID instead of a name; square footage
   differs between the card (4,863) and the detail page (6,904); featured listings show
   "Image Coming Soon".
8. **Ugly, fragile URLs.** A listing page URL carries the whole listing in the query
   string (address, beds, price, image URL). Public sites resolve to `/site/<uuid>`.
9. **Long forms lose leads.** The contact form has 13 fields. Every extra field cuts
   sign-ups.
10. **Filler content.** "Market insights" sections describe features ("track price
    movements in real-time") with no actual data.
11. **Production leftovers.** Replit's dev banner script loads on the live site.

## Version 1 goal

A clean, fast rebuild of the core loop every agent pays for:

> A visitor finds a home on the agent's site → asks about it → the agent sees the lead
> immediately, works it through the pipeline, and follows up.

### In version 1
- **Agent back office with its own layout** (sidebar): Today, Leads, Pipeline
  (drag and drop), Listings, Website, Settings.
- **Today page:** new leads, tasks due, visitors this week. Only real numbers.
- **Leads:** inbox list with search/filter, lead detail with timeline, notes, tasks,
  stage changes.
- **Website editor:** a handful of plain sections (Brand, Home page, About, Contact,
  SEO), with a real preview of the actual site beside the form. Autosave.
- **Public agent site** at a clean URL (`/s/<agent-slug>`): home, home search with
  map + filters, listing pages with clean URLs, about, contact. A short 4-field contact
  form and a tour-request form, both creating leads.
- **Listings:** sample listings (fictional) behind a swappable "listing source", so a
  real MLS/IDX feed can be plugged in later.
- **Simple analytics:** page views and listing views, counted once, shown once.
- **Accounts:** sign up, log in, log out. One agent per account in v1.
- **Fast:** public pages rendered on the server; no admin code sent to visitors.

### Not in version 1 (later phases, most need money or accounts)
Real MLS/IDX feed (needs an IDX agreement) · sending real email/SMS (needs a provider) ·
payments/billing · custom domains · teams/seats · builder features (projects, floor
plans, plat maps, warranty) · AI blog/testimonial writing · visitor accounts and saved
searches · going online (hosting).

Emails the app "sends" in v1 are written to an outbox inside the app instead.
