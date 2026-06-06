# Implementation Plan: melsom.guide

Task tracker for building melsom.guide per the [tech spec](./TECH-SPEC-melsom-guide.md),
[requirements](./REQUIREMENTS-melsom-guide.md), and [PRD](./PRD-melsom-guide.md). Check items off as
they land.

---

## 1. Repo bootstrap
- [x] Create `~/Code/melsom-guides` with `guides/`, `functions/`, `assets/og/`, `specs/`
- [x] Relocate the three spec docs into `specs/` (raleigh-ttd left untouched)
- [x] Seed design base: copy `style.css`, `favicon.svg`, and `og-image.png` → `assets/og/default.png`
- [x] Add `.gitignore`, `README.md`, fresh `CLAUDE.md`
- [x] Add `guides/index.json` manifest and a `guides/raleigh.json` skeleton
- [x] Add `functions/[[path]].js` stub
- [ ] `git init`, initial commit on `main`
- [ ] `gh repo create melsom-guides --public`, push

## 2. Data — complete the Raleigh migration (`guides/raleigh.json`)
- [ ] Define top-level section `color`s (reuse today's category colors) for Restaurants, Coffee & Tea,
      Bakeries, Ice Cream, Attractions, Baby Shower 2026 (Short List already done)
- [ ] Migrate **Baby Shower 2026** section (incl. Sam Jones BBQ — lives here only)
- [ ] Migrate **Restaurants** (4 subsection groups: Breakfast & Brunch, Asian & Sushi, Dinner & Date
      Night, Casual & Quick)
- [ ] Migrate **Coffee & Tea**
- [ ] Migrate **Bakeries**
- [ ] Migrate **Ice Cream**
- [ ] Migrate **Attractions** (3 groups: Shops & Markets, Parks & Gardens, Museums & Family)
- [ ] Drop all city labels; carry `breakfast`/`kids` tags only
- [ ] Confirm one section per place; Iris/Boulted/NC Farmers Market remain in Short List only
- [ ] Derive stable `slug`s from today's `id="place-…"`
- [ ] Remove the `_status` skeleton note once complete
- [ ] Validate: every place has a unique slug; tags resolve; JSON parses

## 3. SPA shell (`index.html`)
- [ ] Build `<head>`: meta defaults, theme pre-paint script, Leaflet + MarkerCluster CSS, `style.css`,
      favicon (rename theme localStorage key off `ttd-theme`)
- [ ] Body skeleton: header (theme toggle, `<h1>` with guide-dropdown slot, accent rule, intro),
      filters bar (search only — **no reset button**), `#map`, empty `<main>`, footer
- [ ] Leaflet + MarkerCluster `<script>` tags
- [ ] Port the theme-toggle script (generic) from raleigh-ttd

## 4. Render module (`index.html` inline script)
- [ ] Parse route → `[guideSlug, placeSlug?]`; resolve default + unknown-guide fallback
- [ ] Fetch `guides/index.json` + `guides/<slug>.json` in parallel
- [ ] Apply per-guide `--accent` (light theme)
- [ ] Render header (title + guide dropdown from manifest) and intro
- [ ] Render sticky nav (one anchor per section)
- [ ] Render `<main>`: sections → `.section`; `style:"highlight"` → `.shortlist` modifier; subsection
      `groups` → `.section-group`; places → `.card` (`id="place-<slug>"`, `data-section`, lat/lng)
- [ ] Focus a place when the route includes a place slug (scroll + flash + show pin)

## 5. Map (port from raleigh-ttd, drive from rendered cards)
- [ ] Build markers colored by **section** color; clustering; tooltips
- [ ] Legend from the guide's top-level sections + colors
- [ ] Two-way card↔pin linking (click card → focus pin; click pin → scroll/flash card)
- [ ] Auto-fit bounds to the guide's places
- [ ] Geolocation "You are here" (graceful on denial)

## 6. Search & filter
- [ ] Free-text search over name + description (cards + pins together)
- [ ] Filter chips for **section** and **tag**
- [ ] Conjunctive (AND) combination across search + chips
- [ ] Live match count + empty state
- [ ] Clear via per-chip toggle + native search clear (no reset control)

## 7. Routing & guide switching
- [ ] Path routing `/`, `/<guide>`, `/<guide>/<place>` via `history.pushState` (no full reload)
- [ ] `popstate` handler for back/forward
- [ ] Guide switch: fetch new JSON, re-render header/nav/main, rebuild map, re-apply accent, reset
      scroll; theme persists
- [ ] "Share this place" affordance copies `/<guide>/<place>`

## 8. Per-guide link previews (`functions/[[path]].js`)
- [ ] Pass static assets through untouched
- [ ] For app routes: inject per-guide `<title>`, description, canonical, `og:*`, `twitter:*`
- [ ] Unknown guide → default guide meta; place URLs → guide-level preview
- [ ] `og:image` ← `guide.ogImage` else `/assets/og/default.png`

## 9. Styling additions (`style.css`)
- [ ] Generalize `.shortlist .card` into the `"highlight"` section style
- [ ] Filter-chip styles (pill + active state)
- [ ] Inline title guide-dropdown (accessible `button[aria-haspopup]` + menu)
- [ ] Remove `.filter-reset` styles
- [ ] Per-guide accent via `--accent` on `:root`

## 10. Assets
- [ ] Create `assets/og/raleigh.png` and set `ogImage` in the Raleigh guide (start from `default.png`)

## 11. Hosting / deploy
> Tooling: use the **`cf`** CLI (wrangler not installed). `cf pages projects` for the project +
> deploys + custom-domain bindings; `cf dns`/`cf zones`/`cf registrar` for the domain. `cf auth whoami`
> to confirm login first; `cf agent-context pages` can surface exact command/flags.
- [ ] `cf auth` — confirm logged in to the right account
- [ ] Create the Cloudflare Pages project for `melsom-guides` (build: none; output: repo root;
      auto-deploy on push) via `cf pages projects`
- [ ] Bind custom domain `melsom.guide` (+ `www` redirect) — `cf pages projects` + `cf dns`
- [ ] Confirm `raleigh-ttd` GitHub Pages stays live and untouched (coexist)

## 12. Verification (see tech spec → Verification)
- [ ] Routes render: `/`, `/raleigh`, `/raleigh/<place>`; unknown guide → default; back/forward
- [ ] Guide switch: no reload, URL + map + accent update, theme persists
- [ ] Search/filter AND logic; count; empty state; clears
- [ ] Map: one pin per place; legend matches sections; clustering, linking, geolocation
- [ ] Previews: `curl` an app route shows guide-specific meta; assets pass through
- [ ] Data integrity: one section per place; unique slugs; tags resolve
- [ ] A11y/responsive: keyboard dropdown + chips; usable at ~360px; reduced-motion respected
- [ ] Local dev verified with `cf dev` (falls back to wrangler/miniflare if `cf` requires it)

## 13. Docs
- [ ] Keep `CLAUDE.md` + `README.md` accurate as the build lands
- [ ] Remove the bootstrap "in progress" note once v1 ships
