# Phase 5: Status of version 1 (2026-10-25)

## Built and checked in the browser
- Landing page, sign up, log in, log out.
- Back office:
  - Today: a "call sheet" of who's waiting, plus tasks, traffic and activity.
  - Leads inbox with search and stage filters.
  - Lead page: reply (to an in-app outbox), notes, tasks, stage, history.
  - Pipeline: drag between stages, or use the menu on each card.
  - Listings: star a home to feature it on your site.
  - Website editor: autosaves, shows a live preview beside the form and has a phone-size preview.
  - Settings, including the outbox.
- Public agent site (`/s/<slug>`):
  - Home page with search, featured homes, the agent's bio and testimonials, and a contact form.
  - Search with a map and filters.
  - Listing pages with a tour/question form.
  - About and contact pages.
  - Page-view counting.
- Phone layouts checked at 390px wide, with no sideways scrolling.

## Skills applied
- **frontend-design** (Anthropic): visual identity pass. The design plan and the changes made
  against generic defaults are in `03-design.md`.
- **web-design-guidelines** (Vercel): accessibility and UI audit. Fixes made:
  - Skip link, and scroll padding so sticky headers don't hide focused fields.
  - Keyboard alternative for dragging in the pipeline.
  - Save status announced to screen readers (`aria-live`).
  - Visible labels on the enquiry form, no spellcheck on email fields, placeholders end in "…".
  - Balanced headings, `touch-action`, number formatting with `Intl`, preconnect to the photo host.
  - Deprecated image `priority` replaced with `loading="eager"`.
- **systematic-debugging**: two dev-only errors were traced to their causes; neither was a code bug:
  - The map "container reused" error was caused by Claude's own test, which replaced the page body.
  - The hydration mismatch was the dev server serving the page halfway through a hot reload.
- **requesting-code-review**: an independent reviewer subagent read every file.
  - It found no critical issues. Agents can't reach each other's data, and there's no SQL
    injection, XSS or open redirect. CSRF is covered by Next's same-origin check on actions.
  - All 5 "important" findings are fixed and verified in the browser:
    1. Editor lost edits typed just before leaving the page. Pending changes are now sent on
       leaving. Verified: a phone number typed 100 ms before navigating was saved.
    2. The search map was broken on phones because it started hidden. It now re-measures when
       shown. Verified at 390px: 375×528, tiles loaded, all 40 pins fitted.
    3. No abuse limits. Now in place:
       - Login: 10 tries per email and 30 per address in 15 min. Verified: try 11 was blocked.
       - Sign-up: 10 per hour per address.
       - Lead form: 10 per hour per address and 300 per day per site.
       - Visit counter: same-origin only (foreign origin gets 403), 300 per hour per address.
    4. Password change added to Settings; it signs out other devices. Verified: a wrong
       current password is rejected, and a real change works.
    5. Database migrations via `PRAGMA user_version`. Verified: the existing database upgraded
       in place to version 2.
  - Minor fixes also made:
    - Missing listing photos fall back to a default image.
    - Real calendar-date check for task due dates.
    - The traffic chart shows all 14 days, including days with no visits.
    - Sold and pending featured homes are labelled.
    - The pipeline's unread marker uses Signpost yellow.
    - The `next` return path keeps its query string.
    - Expired sessions are cleaned up.
    - Password hashing no longer blocks the server.
    - A sign-up race returns a friendly error.
    - Tour-date rules match on client and server.
    - The editor enforces its character limits.
    - The preview reloads only after a successful save.
  - Left open (minor):
    - The unread badge can lag by one after opening a lead.
    - Some listing-table joins live outside `listings.ts` (documented in that file).
    - The greeting uses the server's clock.
    - The agent's own visits to their site are counted.
    - The live preview needs a 1280px+ wide window.
- **verification-before-completion**: final checks were run fresh.
  - `tsc` exit 0, `eslint` exit 0, `next build` exit 0.
  - Every route was smoke-tested on the production server. Public pages respond in 10–30 ms,
    signed-out back-office requests go to login, and unknown pages return 404.

## Performance vs the old site
JavaScript sent to a visitor of an agent's site:
- Old app: 5.3 MB, the whole platform including admin code.
- New app: 587 KB raw, 183 KB gzipped. That's about 9× less.

## Dev-only gotcha found while testing
A stale Turbopack cache (`web/.next`) once caused an endless hot-reload loop in the dev
server. Deleting `.next` fixed it. It can't affect production builds.

## Not done (needs money, accounts or a decision)
Real MLS/IDX feed · sending real email/SMS · payments · custom domains · teams/seats ·
builder features · AI writing tools · visitor accounts and saved searches · hosting ·
automated tests.

# Version 1.1: brand restyle (2026-10-25)

Plan: `docs/superpowers/plans/2026-10-25-brand-restyle.md`. The ledger, with every decision
("Ruling:"), is in `.superpowers/sdd/2026-10-25-brand-restyle/progress.md`. The design record
is `03-design.md`, under "Brand direction, round 2".

## What changed
- **Brand:** "I make page, literally".
  - Dark ground, Schibsted Grotesk, bronze accent.
  - Logo "Still typing": a wordmark plus a block cursor. The icon and apple icon are
    "i" plus the cursor.
- **Landing page:** the hero is a live builder. Type a name and town, and the preview site
  fills in. Below it:
  - A how-it-works slider.
  - A feature grid built from real UI fragments.
  - Three real Omaha photos (public domain or CC0, credits in `web/public/omaha/credits.json`).
  - FAQ, plus a sentence-style sign-up.
- **Agent sites:** the same look, with a theme system (`src/lib/themes.ts`).
  - Themes: Dark (default) and Daylight. An agent picks a theme and one accent colour.
  - Button text switches to stay at 4.5:1.
  - Adding a theme is one entry.
- **Back office:** taste-skill's app style "true-black flat".
  - Layout: a top bar over one column, and a bottom bar on phones.
  - Surfaces: tone-step panels, with an inverted ink primary button.
  - Bronze is used only for data and for what needs the agent.
  - shadcn/ui (Radix) adds the stage Select, a calendar date picker, menus and toasts.
  - The Website editor has a theme and accent picker, with a live sample of the result.
- **Removed:** the v1 "main colour" and "font style" editor fields. The database columns
  stay but are unused. Also removed: the Fraunces, Newsreader and Geist fonts, and the
  temporary v1 colour aliases.

## Skills used
design-taste-frontend (directions, app sheet, lint and inspector), frontend-design,
tailwind-design-system, shadcn, better-colors, better-typography, better-layout, better-ui,
emil-design-eng, baseline-ui, web-design-guidelines, impeccable (markdown references only),
refactoring-ui, writing-plans, executing-plans, test-driven-development,
verification-before-completion, requesting-code-review.

## Verified (fresh, on the production build)
- `npm test`: 46 passed. `tsc`: 0 errors. `eslint`: clean. `next build`: exit 0.
- Route smoke test: 21 of 21 routes. That covers public pages, agent sites, 404s, icons, the
  signed-out redirect, and every signed-in back-office screen (checked through a local
  test-session proxy).
- Taste lint: 0 FAIL and 0 WARN, in both page and app modes.
- Taste inspector, at 1440 and 390 px: 0 FAIL on the landing page, 3 agent-site pages in both
  themes, the 7 back-office screens and login.
  - The remaining WARNs are defended in the ledger. They come from blocks sized to their
    data, and the "Website" label in the phone bar.
- The landing page has 23 moving elements. With reduced motion, all content shows.
- Nothing on the page loops for longer than 5 seconds (WCAG 2.2.2).
- In Chrome: the date picker leads to a "Task added" toast and a new row. The stage Select
  opens on the dark tokens. A failed save shows an error beside the form.

## Final code review (fresh reviewer, Opus)
- No critical findings. The three important ones are fixed, each with a test that failed first:
  1. A failed save wiped what the agent had typed. Now the fields clear only after a save
     works, and an expired session still goes to login.
     - Checked in Chrome: through a deliberately broken connection, the note stayed with the
       error beside it.
     - Through the working connection, the field cleared and showed a "Note saved" toast.
  2. Button text on some accent colours fell below 4.5:1. It now falls back to black, which
     is tested across 4,096 colours on both themes.
  3. A faint accent made focus rings and hover text vanish on agent sites. A new
     `--accent-text` role uses the accent only when it reaches 3:1, and the ink otherwise.
- Eight minor findings are listed in the ledger ("minor (deferred)").

## Left open
- The eight minor review findings (ledger).
- Dates use the machine's local time. A hosted build needs a per-agent timezone.
- The search list/map toggle and the editor's section tab aren't kept in the URL.
- The public tour date stays a native date input. shadcn's popovers render outside the
  agent's theme.


# Version 1.2: light rebuild (2026-10-26)

The dark restyle (1.1) was turned down. The whole app is rebuilt to the approved Round 5 look;
see `03-design.md` ("Round 5") and the ledger in `.superpowers/sdd/2026-10-26-light-rebuild/`.

## Verified (fresh, on the production build)
- `npm test`: 51 passed. `tsc` 0, `eslint` 0, `next build` exit 0.
- Route smoke test 21/21. Taste lint 0 FAIL / 0 WARN in page and app modes.
- Inspector: 0 FAIL on the landing page, login, all back-office views (including the leads
  side panel) and the agent home, search, listing and about pages. One FAIL is left on the agent
  contact page: still-page, with 4 moving elements against a floor of 8. It's defended in the
  ledger.
- The live database migrated to version 4: the demo site is now Light with the ink accent.
- Served on the local network at http://192.168.4.24:3100.
