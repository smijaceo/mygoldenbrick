# Phase 3 — Design for version 1

## Two separate experiences

**Back office (`/app/...`)**: the agent's tool. Its own layout: a left sidebar on
desktop, a bottom tab bar on phones. It never shares a header with the public site.

| Sidebar item | What it does |
|---|---|
| Today | New leads, tasks due, visitors this week, and recent activity. Only real events. |
| Leads | Inbox list (search, stage filter), plus a lead page with timeline, notes, tasks and stage. |
| Pipeline | Columns per stage. Drag a card to move it (a dropdown on phones). |
| Listings | Browse the listing feed and star homes to feature them on your site. |
| Website | Five plain sections (Brand, Home page, About, Contact, SEO), autosaved, with the real site previewed beside the form. |
| Settings | Account, password, simulated outbox, sign out. |

**Public agent site (`/s/<slug>/...`)**: what home buyers and sellers see. It's fast,
rendered on the server and themed by the agent's colours and font style.
Pages: Home · Search (map + list, filters) · Home detail (`/s/<slug>/homes/<id>`) ·
About · Contact.
Lead forms are short: name, email, phone (optional), message. A tour request adds a
date.

## Visual language
- Neutral warm greys (stone), one accent colour. The back office uses deep green and
  each agent site uses the agent's own colours.
- Geist font in the back office. Agent sites choose "Modern" (sans) or "Classic"
  (serif headings).
- Large touch targets, 16px minimum body text on the public site, and every page works
  at phone width.
- Numbers come from the database only. Empty states say plainly what to do next.

## Visual design pass (frontend-design skill)

**Subject:** working tools for Omaha-area agents, and the sites their buyers browse.
**Primary jobs:** the agent needs to know *who to call next*; the buyer needs to *find a
home and ask about it*.
**Vernacular borrowed:** the yard sign and its hanging "rider" plate (NEW, PENDING, SOLD),
and the MLS listing sheet (price set large, specs in one row).

**Palette**
| Name | Hex | Role |
|---|---|---|
| Paper | `#f4f6f3` | Back-office background. A cool, green-tinged off-white, not cream. |
| Ink | `#1b2420` | Text. |
| Field | `#2e5a43` | imakepage brand green, used for primary actions. |
| Rule | `#d9ded9` | Borders and dividers. |
| Signpost | `#f2c230` | Yard-sign yellow. Means only "this needs you now": unread leads and tasks due today. |
| Slate | `#5d6862` | Secondary text. |

**Type:** Schibsted Grotesk for everything: a sturdy news grotesk with honest figures,
and tabular numbers for prices. Agent sites on the "Classic" style get Newsreader for
headings. One family each, no mixing beyond that.

**Layout**
```
Today (back office): a call sheet, not a dashboard
┌──────────────────────────────────────────┬──────────────┐
│ Good afternoon, Jordan                   │ This week    │
│ 2 people are waiting on a reply, 1 task  │ ▁▃▂▆▂▅▄▃▃▄▃▂ │
│ is due today, 38 people visited.         │ most-viewed  │
│ ── Call next ─────────────────────────── │ homes        │
│ ▌Taylor Brooks   tour Sat   (402)…  Reply│              │
│ ▌Chris Nguyen    home value       Reply  │              │
│ ── Tasks ─────────────────────────────── │              │
└──────────────────────────────────────────┴──────────────┘
Listing card: photo, then a rider plate if status ≠ active,
then the price large, then "3 beds  2 baths  1,580 sq ft" and the address.
Landing: left-aligned headline, then the real loop drawn as a
3-step sequence (it is a sequence): home on your site → buyer asks → it's in Today.
```
Everything is left-aligned. Centred text only appears on empty states.

**Principles**
1. Use the agent's own words: call, reply, tour, offer. Avoid "engagement" and "funnel".
2. Price and people come first. Every list leads with a person or a price.
3. Yellow means "needs you now", and nothing else uses it.
4. Structure must carry information. There are no eyebrow labels, no "→" on links, no
   strings joined with middle dots, and no single word in a headline set in a different colour.

**Review against generic defaults (changes made):**
- The first draft's Today page had three big-number stat cards. That's the default
  dashboard treatment, so it's now one plain sentence plus the call list.
- The landing page had six identical icon feature cards, the "SaaS card kit". It's now
  the actual three-step loop with real UI fragments.
- The first draft used Geist, the starter default, and Fraunces, a common serif choice.
  These are now Schibsted Grotesk and Newsreader.
- Status badges were pill chips. They're now rectangular "rider" plates, taken from the
  yard-sign world.

## Brand direction, Round 5 (decided 2026-10-26) — current

The user saw the dark "I make page, literally" build and turned it down ("the colors, the
layout, the style"). Light directions (round 3) didn't land either. They then chose to keep
imakepage's existing brand and liked Notion's *layout*, adapted so it doesn't copy Notion and
has "no AI generated slop". Round 5 on the design canvas is the approved look:

- **Brand kept from imakepage.com:** the gold brick logo (`/brand/brick.png`, from the site's
  `default-logo.png`), gold `#d4a843`, Inter.
- **Palette:** white ground, `#f9fafb` surface, ink `#111827`, text grey `#4b5563`, meta grey
  `#6b7280`, lines `#e5e7eb`. Gold is a fill only (cursor, unread dots, counts); gold text and
  focus rings use deep gold `#8a6a12`; chart bars `#b8891a`.
- **Layout:** lots of white, one centred headline, the real product as the main picture.
  The landing headline holds the actual name field. Ink-black buttons (8px), cards 12–16px
  radius with a light border, real Omaha photos only.
- **Back office:** white sidebar, the current page as a black pill, leads as a table with the
  lead opening in a side panel.
- **Agent sites:** themes Light (default, white, ink buttons) and Dark (gold buttons).
  Daylight is retired (migration 4 moves it to Light).
- **Not allowed:** gradients, glass, glows, generated photos, fake stats, pill eyebrow labels.

## Brand direction, round 2 (decided 2026-10-25, superseded by Round 5)

This section replaces the v1 visual language above: the stone greys, deep green, Geist,
Fraunces, Newsreader, the "Modern/Classic" font choice and the colour presets are all gone.

Round 1 directions (yard sign, unread dot, printed annual, and the three agent-site boards)
were rejected by the user. In round 2 the user picked **"I make page, literally"**:

- **Idea:** the name says it ("I make page"). The homepage makes the visitor's site on the
  spot: type your name and town, and the real site fills in beside the form.
- **Type:** Schibsted Grotesk only. 800 for headlines (tracking -0.05em, leading 0.88–0.92),
  400 and 600 for text.
- **Colour:** dark ground `#111111`, surface `#1c1c1c`, ink `#f2f2f2`, muted `#8f8f8f`,
  bronze accent `#a08672`. Use `#8b6d58` for bronze on light grounds.
- **Source:** taste-skill direction `product-performs`, palette "Lunar and bronze".
- **Logo (decided):** concept 3, "Still typing". It's the wordmark `imakepage` in Schibsted
  Grotesk 800, followed by a bronze block cursor about 0.4em wide and 0.78em tall, sitting on
  the baseline. The short mark and app icon are "i" plus the cursor. The cursor may blink
  slowly on the landing page only, and is static when reduced motion is on.
- **Agent sites (decided):** they share the landing page's look and get a theme system
  (`web/src/lib/themes.ts`). Adding a theme means adding one entry there. An agent picks a
  theme and one accent colour. Text on the accent switches automatically between dark ink and
  white, whichever reaches 4.5:1. The default bronze follows the theme when the agent
  switches; a colour they picked stays.

  | Role | Dark (default) | Daylight |
  | --- | --- | --- |
  | ground | `#111111` | `#f2f1ee` |
  | surface | `#1c1c1c` | `#e7e5e0` |
  | ink | `#f2f2f2` | `#1d1d1d` |
  | muted | `#8f8f8f` | `#5a5853` |
  | rule | `#2a2a2a` | `#d9d6cf` |
  | danger | `#ff8a7a` | `#b3261e` |
  | default accent | `#a08672` | `#8b6d58` |

  Daylight was first specified as `#f4f1ec` / `#ebe6de` / `#5c5852`. It moved to a cooler
  bone because the taste inspector read the warmer ground as cream. `danger` was added so
  error text reaches AA on both grounds (8.24:1 and 5.79:1).
- **Back office (decided):** taste-skill's app style "true-black flat", kept on the brand
  palette.
  - Layout: no sidebar. A 48px bar sits over one centred 1208px column; on phones a
    five-item bottom bar replaces it.
  - Surfaces: panels are a tone step (`surface`, then `raised #2a2a2a`, then
    `active #333333`), with no borders or shadows.
  - The one primary button is inverted: ink fill, dark text.
  - Bronze appears only on data (traffic bars) and on what needs the agent (unread marks,
    the unread count, tasks due today).
  - Type: the page title is a noun at 24px, weight 800.
  - Motion: no entrance motion. Feedback motion only: a 0.96 press, toasts, and menus.
  - Controls are shadcn/ui on Radix: Select, Popover with Calendar, DropdownMenu, and Sonner
    toasts. Their variables map onto ours in `globals.css`.

Canvas: https://claude.ai/artifact/NSabtq2SQ8XqWtiH9hnhW9 (pages: Logo, Round 2, Round 1).

## Technical choices (Claude's calls)
- Next.js 16 (App Router, server rendering, server actions), TypeScript, Tailwind 4.
- SQLite via Node's built-in `node:sqlite`, so no native build steps on Windows. One
  file: `web/data/app.db`.
- Auth: email + password (scrypt hash). Random session token, stored hashed, in an
  httpOnly cookie.
- Listings come through a `ListingSource` module. v1 reads fictional sample listings
  (Omaha area) from the database; a real IDX feed can replace it later.
- Map: Leaflet + OpenStreetMap tiles (free, no key).
- Email: written to an `outbox` table and shown in Settings, never actually sent.
- Next's Cache Components mode is off; data pages render per request (`force-dynamic`),
  so nothing stale is ever shown.
