# Brand Restyle ("I make page, literally") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole imakepage v1 app (landing page, public agent sites, back office) to
the approved brand, and add a theme system to agent sites, using the installed design skills
at each step.

**Architecture:** All colour comes from semantic CSS tokens, as the tailwind-design-system
skill prescribes. Themes are data in `src/lib/themes.ts` that turn into CSS variables on a
wrapper element, so a new theme is one new object. The landing hero becomes a client
component that builds a real agent-site preview from what the visitor types. Each surface
passes the taste-skill gate (`lint.mjs` + `inspect.mjs`, with `--app` for back-office
screens) before it counts as done.

**Tech Stack:**
- Next.js 16.4 (App Router), React 19.3, Tailwind 4, node:sqlite.
- vitest 5.0.5 for unit tests.
- shadcn 4.22 CLI for Select, Popover/Calendar and DropdownMenu.
- sonner 2.0.8 for toasts.

**Spec:** `docs/03-design.md`, section "Brand direction, round 2". The canvas is at
https://claude.ai/artifact/NSabtq2SQ8XqWtiH9hnhW9 (board "1. I make page, literally" and
the Logo page, concept 3).

## Global Constraints

**Brand**
- Typeface: Schibsted Grotesk only.
  - Headlines: weight 800, tracking -0.05em, leading 0.88–0.92.
  - Text: weight 400; 600 for functional labels.
  - Remove Fraunces and Newsreader.
- Brand palette:
  - Ground `#111111`, surface `#1c1c1c`.
  - Ink `#f2f2f2`, muted `#8f8f8f`.
  - Accent bronze `#a08672`; on light grounds use `#8b6d58`.
- Logo: the wordmark `imakepage` (800), then a bronze block cursor about 0.4em wide and
  0.78em tall on the baseline. The short mark is "i" plus the cursor.
  - The cursor blinks only on the landing page.
  - The cursor is static under `prefers-reduced-motion: reduce`.

**Agent sites and themes**
- Agent sites default to the theme `dark` (the brand look). `daylight` is the warm off-white
  theme from the mockup's mini site:
  - ground `#f4f1ec`, surface `#ebe6de`, ink `#1d1d1d`, muted `#5c5852`.
- An agent picks a theme and one accent colour. Text on the accent switches automatically
  between ink and white, whichever gives at least 4.5:1 contrast.

**taste-skill house rules** (they apply everywhere)
- No eyebrow labels and no ALL-CAPS tracked labels.
- No gradients, except a neutral scrim under text on a photo.
- No shadows on resting elements and no hairline-rule decoration.
- No "→" on links and no strings joined with middle dots.
- Two lines or fewer for every heading at 1440, 768 and 390px.
- Body text is 16px or larger.

**Quality floor**
- Visible focus, keyboard access, and AA contrast.
- No horizontal scroll at 390px.
- Motion uses transform and opacity only, with a reduced-motion fallback.

**Content and process**
- No invented proof. There are no pricing figures (we have none), and nothing like
  "trusted by N agents".
- No git commits. The project isn't a repo and the user hasn't asked; skip every
  commit step.
- Before using a skill's script, read it. impeccable downloads a binary on first run: don't
  run its launcher; use its markdown references instead.

## Review Focus

1. An accent colour too light or too dark for the chosen theme should never make button
   text unreadable. Tested in Task 1 (`accentInk`).
2. A live-builder name that's empty, 60 characters long or full of emoji should never break
   the layout. Empty falls back to "Your name"; long names wrap within two lines. Tested in
   Task 3.
3. An existing database from v1, with no `theme` column, should upgrade in place to theme
   `dark` with no data loss. Tested in Task 1 (migration 3).
4. Reduced-motion users should see no blinking cursor and no entrance motion, with all
   content visible. Checked in Task 6 with the taste inspector's reduced-motion run.
5. At 390px the builder stacks with the preview under the form, and no page scrolls
   sideways. Checked by the inspector at 390px in Tasks 3–5.

---

### Task 0: Test runner

**Files:**
- Create: `web/vitest.config.ts`
- Modify: `web/package.json` (scripts: `"test": "vitest run"`)

- [ ] **Step 1:** `npm i -D vitest@5.0.5`. Write `vitest.config.ts` with `resolve.alias`
  `@` → `./src`, `test.environment: "node"`, and include `src/**/*.test.ts`.
- [ ] **Step 2:** Add a trivial `src/lib/format.test.ts` that asserts
  `unit(1, "bed") === "1 bed"` and `unit(2, "bath") === "2 baths"`. Run `npm test`.
  Expected: 2 passed.

### Task 1: Theme tokens and theme data (skills: tailwind-design-system, better-colors)

**Files:**
- Create: `web/src/lib/themes.ts`, `web/src/lib/themes.test.ts`
- Modify: `web/src/app/globals.css`, `web/src/lib/db.ts` (append migration 3),
  `web/src/lib/sites.ts` (allow `theme`), `web/src/lib/types.ts` (`Site.theme`)

**Interfaces:**
- Produces: `type ThemeId = "dark" | "daylight"`
- Produces: `THEMES: Record<ThemeId, { name: string; ground: string; surface: string; ink: string; muted: string; rule: string }>`
- Produces: `accentInk(accentHex: string, theme: ThemeId): string`, which returns the ink
  colour or `#ffffff`
- Produces: `contrast(a: string, b: string): number`
- Produces: `themeVars(theme: ThemeId, accent: string): Record<string, string>`, giving
  `--ground --surface --ink --muted --rule --accent --accent-ink`
- Produces Tailwind utilities `bg-ground bg-surface text-ink text-muted border-rule bg-accent text-accent-ink`

- [ ] **Step 1: Failing tests** in `themes.test.ts`:
  - `contrast("#000000", "#ffffff")` ≈ 21 (to 1 decimal place)
  - `accentInk("#a08672", "dark") === "#111111"`
  - `accentInk("#1f3d2b", "dark") === "#ffffff"`
  - `themeVars("daylight", "#8b6d58")["--ground"] === "#f4f1ec"`
  - `Object.keys(themeVars("dark", "#a08672"))` has length 7
- [ ] **Step 2:** `npm test` fails: module not found.
- [ ] **Step 3:** Implement `themes.ts`. Use WCAG relative luminance for `contrast`.
  `accentInk` returns the theme's dark ink (`#111111` for dark, `#1d1d1d` for daylight) when
  that reaches ≥ 4.5:1 against the accent, otherwise `#ffffff`.
- [ ] **Step 4:** Migration 3 in `db.ts`:
  `ALTER TABLE sites ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'`, plus
  `UPDATE sites SET accent_color = '#a08672' WHERE accent_color = '#c08a3e'` (the old
  default).
  - `validateField("theme", v)` accepts only keys of `THEMES`.
  - `font_style` and `primary_color` stay in the schema but are no longer edited (YAGNI;
    no destructive migration).
- [ ] **Step 5:** Rewrite `globals.css` `@theme inline`:
  - Map `--color-ground` and the other semantic colours to `var(--ground)` and so on.
  - Set `--font-sans` to Schibsted Grotesk.
  - Set `:root` vars from the dark theme with the bronze accent.
  - Remove the `.site-classic` rule and the old `--color-paper/brand/signpost` aliases. Any
    use found by `grep -rn "brand\|signpost\|paper\|site-" src` is updated in Tasks 3–5.
- [ ] **Step 5b (ui-ux-pro-max):** Read `scripts/search.py` first. Then run its
  real-estate and SaaS palette and font-pairing search as a sanity check on the daylight
  theme. Record any contrast problem it flags; don't adopt its palettes.
- [ ] **Step 6:** `npm test` and `npx tsc --noEmit` both pass.
  - Restart the dev server.
  - Confirm `PRAGMA user_version` = 3 on the existing `data/app.db`.
  - Confirm the demo row now has theme `dark`.

### Task 2: Logo and icons (skills: better-ui)

**Files:**
- Modify: `web/src/components/logo.tsx`
- Create: `web/src/app/icon.svg`, `web/src/app/apple-icon.png`
- Delete: `web/src/app/favicon.ico`

**Interfaces:**
- Produces: `<Logo variant?: "full" | "mark"; blink?: boolean; className?: string />`. It
  renders `<span aria-label="imakepage">` with the caret as `<span aria-hidden>`. The caret
  is sized in em (`width: 0.4em; height: 0.78em`) and uses colour `var(--accent)`.

- [ ] **Step 1:** Implement `Logo`. The blink is the CSS keyframe `caret` in `globals.css`
  (opacity 1→0, `steps(1)`, 1.1s), applied only when `blink` is true, and turned off inside
  `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 2:** Write `icon.svg`: a 64×64 `#111111` square with radius 14, a white "i"
  (Schibsted 800 converted to a path is not needed; use rects:
  stem `x=20 y=24 w=9 h=26`, dot `x=20 y=12 w=9 h=8`), and a bronze block `x=33 y=20 w=13 h=30`.
  - Render `apple-icon.png` (180×180) from the same SVG with
    `npx --yes @resvg/resvg-js-cli`, or skip it and say so if that isn't available.
- [ ] **Step 3:** Run `npm run build`. Confirm `/icon.svg` returns 200 and the tab shows the
  icon (screenshot).

### Task 3: Landing page with the live builder (skills: design-taste-frontend page run, emil-design-eng)

**Files:**
- Create: `web/src/app/(marketing)/live-builder.tsx` (client component)
- Create: `web/src/lib/builder.ts` and `builder.test.ts`
- Move and rewrite: `web/src/app/page.tsx` → `web/src/app/(marketing)/page.tsx`
- Modify: `web/src/app/(auth)/signup/page.tsx` and `auth-form.tsx` (prefill from `?name=&area=`)

**Interfaces:**
- Consumes: `searchListings` (server) for real sample listings passed as props; `Logo`;
  theme tokens.
- Produces: `previewCopy(name: string, area: string): { title: string; heading: string; slug: string }`
  - Empty name gives title "Your name".
  - Empty area gives heading "Homes for sale near you".
  - Otherwise heading `Homes for sale in ${area}`.
  - `slug` uses the same rules as signup's `slugify`; move `slugify` into `builder.ts` and
    import it in `(auth)/actions.ts`.

- [ ] **Step 1: Failing tests:**
  - `previewCopy("", "").title === "Your name"`
  - `previewCopy("Jordan Avery", "Dundee").heading === "Homes for sale in Dundee"`
  - `previewCopy("Jordan Avery", "").slug === "jordan-avery"`
  - A 60-character name returns that name unchanged; wrapping is the UI's job.
- [ ] **Step 2:** Run the taste-skill page run, steps 1–5:
  - Re-read `.taste-skill/r2-1-performs.md` (direction `product-performs`, seed already dealt).
  - Write the argument and the copy deck into `docs/landing-copy.md`.
  - Sections, in order: hero (live builder), how-it-works (type, preview, publish; a real
    sequence, so an ordered list is allowed), features (the back office shown as real
    fragments built with `data-ui`), faq (4 real questions: MLS feed, own domain, email,
    phone), cta, footer.
  - No pricing section.
- [ ] **Step 3:** Implement `LiveBuilder` from props `{ listings: ListingCardData[] }`.
  - The inputs "Your name" and "Where you sell" are controlled, but cheap per keystroke.
  - The preview is the `daylight`-themed mini site, using real listing photos and prices.
  - "Make my page" links to `/signup?name=…&area=…`.
  - From the md breakpoint up, form and preview sit side by side; below it they stack.
- [ ] **Step 4:** Update the signup form to read `name` and `area` from searchParams into
  `defaultValue`.
- [ ] **Step 5: Gate.** Run against the production build (`next build && next start -p 3100`):
  - `node <taste>/scripts/lint.mjs src/app/(marketing)`
  - `node <taste>/scripts/inspect.mjs http://localhost:3100/`
  - Fix every FAIL.
  - Open every screenshot in `.taste-skill/inspect/` and critique it with
    `references/critique.md`. At most three rounds.
- [ ] **Step 6:** Run `npm test`. All pass.

### Task 4: Agent public site on the theme system (skills: design-taste-frontend, better-typography, better-layout)

**Files:**
- Modify:
  - `web/src/app/s/[slug]/layout.tsx` (wrapper `style={themeVars(site.theme, site.accent_color)}`; drop the font switch)
  - `page.tsx`, `parts.tsx`, `lead-form.tsx`, `search/*`, `homes/[id]/page.tsx`, `about/page.tsx`, `contact/page.tsx`
  - `not-found.tsx`
- Modify: `web/src/app/s/[slug]/search/map.tsx` (pin colours from `--accent` and `--accent-ink`)

- [ ] **Step 1:** Replace every `text-site`, `bg-site`, `text-site-accent`, `stone-*` and
  hard-coded hex in `s/[slug]` with the semantic utilities.
  - Check with: `grep -rnE "site-|stone-|#[0-9a-f]{6}" "src/app/s/[slug]"` should only match
    the map and alt text.
- [ ] **Step 2:** Rebuild the home page to the mockup's mini-site structure:
  - Wordmark bar.
  - A photo hero with the h1 over a neutral scrim.
  - Listing rows with the price at 800 weight.
  - About, quotes, contact.
  - Keep every existing data path and form.
- [ ] **Step 3: Gate.** Run `inspect.mjs` on `/s/jordan-avery`, `/s/jordan-avery/search`
  and `/s/jordan-avery/homes/3`, in both themes (switch the demo with a SQL update). Get
  0 FAIL, and critique the screenshots.

### Task 5: Back office restyle (skills: design-taste-frontend app run, shadcn, impeccable references, refactoring-ui)

**Files:**
- Modify: everything under `web/src/app/app/`, `web/src/components/ui.tsx`, and
  `web/src/app/(auth)/*`.
- Create (via shadcn CLI): `web/components.json`, and `web/src/components/ui/select.tsx`,
  `popover.tsx`, `calendar.tsx`, `dropdown-menu.tsx`, `sonner.tsx`.

- [ ] **Step 1:** Read `references/app-screens.md` in full. Then run:
  `node <taste>/scripts/draw.mjs --app --kind <inbox-or-dashboard> --brief "imakepage back office" --keep palette,type --out .taste-skill/app`
  Use the dealt shell and screen patterns.
- [ ] **Step 2:** Follow the shadcn skill's init for Tailwind v4.
  - Then `npx shadcn@4.22.1 add select popover calendar dropdown-menu sonner`.
  - Map shadcn's CSS variables onto our tokens (`--background: var(--ground)` and so on)
    instead of its defaults.
- [ ] **Step 3:** Replace the native stage `<select>` (lead page and pipeline cards) with
  `Select`.
  - Replace the task due-date and tour-date inputs with `Popover` + `Calendar`.
  - Fire `toast()` on "Reply sent", "Task added" and "Password changed".
  - Keep every server action and its signature unchanged.
- [ ] **Step 4:** Restyle the shell, Today, Leads, Lead, Pipeline, Listings, Website editor
  and Settings to the dark brand:
  - Yellow "Signpost" is replaced by bronze as the only "needs you" colour.
  - Panels are separated by a tone step, not borders, per taste's app rules.
- [ ] **Step 5: Gate.** `node <taste>/scripts/inspect.mjs <url> --app` on `/app`,
  `/app/leads/1`, `/app/pipeline` and `/app/website`, signed in as the demo user via a cookie
  the inspector accepts. If it can't authenticate, use browser screenshots at 1440 and 390
  and say so. Get 0 FAIL, then critique.

### Task 6: Motion and polish (skills: emil-design-eng, better-ui, baseline-ui)

**Files:** `web/src/app/globals.css`, plus the components touched above.

- [ ] **Step 1:** Add the motion tokens:
  - `--ease-out: cubic-bezier(0.2, 0, 0, 1)` and `--dur: 160ms`.
  - Buttons: `active:scale-[0.97]`, with `transition-property: transform, background-color`.
  - Landing: section entrances that stagger heading, text then picture at 70ms, rising
    20px, once.
  - Live-builder preview: cross-fade on change.
- [ ] **Step 2:** Run the baseline-ui review over `src/app` and fix the violations that
  apply. Skip its library mandates (motion/react, Base UI, `cn`) except `cn`, which shadcn
  adds.
- [ ] **Step 3:** Run `inspect.mjs` once more on `/`. The motion count must be ≥ 8, and the
  reduced-motion screenshots must show all content.

### Task 7: Audits and final verification (skills: web-design-guidelines, impeccable audit references, verification-before-completion, requesting-code-review)

- [ ] **Step 1:** Run the web-design-guidelines review over `src/**/*.tsx` and fix every
  finding.
- [ ] **Step 2:** Run the impeccable "audit" and "critique" checklists, from its markdown
  references only, plus the refactoring-ui hierarchy and spacing audit, on the landing page
  and Today. Fix the top three findings from each.
- [ ] **Step 3:** All of these must pass, each run fresh:
  - `npm test`
  - `npx tsc --noEmit`
  - `npx eslint src`
  - `npm run build`
  - an HTTP smoke test of every route
  - The taste inspector shows 0 FAIL on the final production build.
- [ ] **Step 4:** Dispatch a code-review subagent (requesting-code-review template). Fix
  Critical and Important findings and verify each one.
- [ ] **Step 5:** Send the user screenshots (desktop and phone) and update
  `docs/04-status.md`.
