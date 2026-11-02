# Light rebuild (Round 5 direction) Implementation Plan

> Executed inline (native). The user approved the direction ("Yes. Rebuild it.") and asked not to be re-asked once a plan is approved.

**Goal:** Restyle the whole app to the approved Round 5 mockups (design canvas, page "Round 5"): white pages, Inter, ink-black buttons, imakepage's gold brick logo and gold #d4a843 used sparingly, real Omaha photos, the product as the hero picture. Notion-style layout without copying Notion; no AI-looking effects.

**Spec:** the Round 5 boards (R5Landing, R5App) + user rules: keep imakepage's brand (brick logo, gold, Inter); no AI slop (no gradients, glass, glows, generated photos, fake stats, pill eyebrows).

## Global Constraints
- Palette: ground #ffffff, surface #f9fafb, raised #f3f4f6, ink #111827, muted #4b5563 (text) / #6b7280 (meta), rule #e5e7eb, gold #d4a843 (caret, needs-you marks, highlight only — never body text on white), danger #b42318.
- Type: Inter 400/500/600/700/800. Headlines 800, tracking -0.04em.
- Buttons: ink fill + white text (primary), #f3f4f6 fill (secondary); radius 8px. Cards radius 12px, 1px #e5e7eb border, at most a faint shadow on floating panels.
- Logo: the brick image from imakepage.com (`/assets/defaults/default-logo.png`) + "imakepage" in Inter 700.
- Agent sites: new default theme "light" (white); "dark" kept as an option; "daylight" retired (migrates to light). Default accent ink #111827.
- Every server action and its signature unchanged. Tests first for every lib change.

## Tasks
1. Tokens, fonts, logo (Logo test first).
2. Themes: light/dark, migration 4, seed + signup defaults (tests first).
3. Landing page: Round 5 hero with the live name field in the headline, product preview with inbox card, sections below.
4. Auth pages.
5. Back office: sidebar shell, leads table with side panel, restyle the rest.
6. Agent sites restyle.
7. Verify: tests, tsc, eslint, taste lint, build, smoke, inspector, screenshots; serve on the LAN.
