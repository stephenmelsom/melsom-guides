# Tech Spec: melsom.guide — multi-location guides

Implements [REQUIREMENTS-melsom-guide.md](./REQUIREMENTS-melsom-guide.md) (derived from
[PRD-melsom-guide.md](./PRD-melsom-guide.md)). This is the *how*: architecture, data format, routing,
rendering, hosting, and previews.

## Approach in one paragraph
Stay a **static, no-build, vanilla-JS SPA** (per NFR-7) — one HTML shell + `style.css` + a render
script. Move all place content out of `index.html` into **per-guide JSON files**; the script renders
both the cards and the Leaflet map from that JSON. Host on **Cloudflare Pages** with a small **Pages
Function** that (a) serves the SPA shell for app routes and (b) injects per-guide `<title>`/`og:` tags
so shared links preview correctly. Path-based URLs: `/`, `/<guide>`, `/<guide>/<place>`.

## Key change from today
Today every place is hand-written in `index.html` and the map is *derived* from the card DOM
(`data-lat`/`data-lng`/`data-category`, `index.html:1090-1119`). New model: **JSON is the source of
truth**; JS builds the card DOM (reusing the existing class structure so `style.css` barely changes)
and the map from the same data. One definition per place → the card/pin "two places in sync" problem
disappears (FR-31).

---

## Repo layout
```
index.html              # shell + render module (no hardcoded places)
style.css               # existing styles + additions (dropdown, chips, per-guide accent)
guides/
  index.json            # manifest: default guide + guide list
  raleigh.json          # Raleigh guide (migrated from current index.html)
assets/og/
  default.png           # shared social-preview fallback (reuse current og-image.png)
  raleigh.png           # optional per-guide preview image
functions/
  [[path]].js           # Cloudflare Pages Function: SPA fallback + per-guide meta injection
favicon.svg, raw.txt, README.md, CLAUDE.md
```

## Data model

### Manifest — `guides/index.json`
Drives the title dropdown (FR-4) and the default guide (FR-3). Only listed guides exist (FR-8).
```json
{
  "defaultGuide": "raleigh",
  "guides": [
    { "slug": "raleigh", "name": "Raleigh", "title": "The Melsom Guide to Raleigh" }
  ]
}
```

### Guide — `guides/<slug>.json`
```json
{
  "slug": "raleigh",
  "name": "Raleigh",
  "title": "The Melsom Guide to Raleigh",
  "intro": "Our favorite spots around Raleigh & Cary …",
  "description": "Meta-description / social copy for this guide.",
  "accent": "#0F766E",
  "ogImage": "/assets/og/raleigh.png",
  "tags": [
    { "id": "breakfast", "label": "Breakfast" },
    { "id": "kids",      "label": "Kids" }
  ],
  "sections": [
    {
      "id": "short-list", "title": "Our Short List", "blurb": "The places we keep coming back to.",
      "color": "#0F766E", "style": "highlight",
      "places": [ /* place objects */ ]
    },
    {
      "id": "restaurants", "title": "Restaurants", "blurb": "…", "color": "#e74c3c",
      "groups": [
        { "title": "Breakfast & Brunch", "blurb": "…", "places": [ /* place objects */ ] }
      ]
    },
    { "id": "bakeries", "title": "Bakeries", "blurb": "…", "color": "#d97706", "places": [ /* … */ ] }
  ]
}
```
- **`sections`** are per-guide (FR-10). Each top-level section carries a `color` (its pins + legend
  entry, FR-15/FR-16) and an optional `style`. There is **no** top-level `categories` array and **no**
  `shortlist` array — the section *is* the category, and the Short List is just a section with
  `"style": "highlight"`.
- **`style`** is an **optional capability**, not something every section sets. Most sections omit it
  and render default cards; the only v1 value is `"highlight"` (the accent-bordered/tinted treatment,
  today's `.shortlist .card`, `style.css:421-425`) (FR-31a). In the Raleigh guide only the Short List
  uses it. Extensible later.
- **`tags`** define the available filter chips alongside sections (FR-22). No city facet (FR-11).
- **`accent`** overrides the `--accent` CSS var (FR-30); omit → site default. No hero image.
- A section has **either** `groups` (subsections, which inherit the section color) **or** a flat
  `places` array.

### Place (defined inline in its one section)
```json
{
  "slug": "boulted-bread",
  "name": "Boulted Bread",
  "tags": [],
  "description": "Best bakery in town — stone-milled breads & pastries.",
  "lat": 35.7726, "lng": -78.6465,
  "links": [
    { "label": "Website", "url": "https://boultedbread.com/" },
    { "label": "Map", "url": "https://www.google.com/maps/search/?api=1&query=Boulted%20Bread%2C%20614%20West%20South%20St%2C%20Raleigh%2C%20NC%2027603" }
  ]
}
```
- A place is defined **once, in exactly one section** (FR-13). Its map color comes from that section
  (FR-15) — there is no per-place `category` field.
- **`slug`** is author-controlled and stable → used in the readable place URL; survives display-name
  edits (FR-27). Must be unique within the guide.
- **`tags[]`** reference `tags[].id`.
- **`links`** render in order; 0..n allowed (some places have no Map link, some have two website-style
  links) (FR-12).

> No cross-listing / `ref` mechanism: since every place lives in exactly one section, there is never a
> duplicate pin (FR-20) and nothing to keep in sync.

---

## Routing & navigation
- `/` → default guide (FR-3); `/<guide>` → that guide; `/<guide>/<place>` → that guide with the place
  focused (FR-27).
- Client parses `location.pathname` → `[guideSlug, placeSlug?]`. Unknown guide → default (FR-7);
  unknown place → load guide, skip focus.
- In-app navigation (dropdown selection, opening a place) uses `history.pushState` — no full reload
  (FR-5); a `popstate` handler re-renders for back/forward (FR-6).
- "Share this place" affordance copies `…/<guide>/<place>`.

## Cloudflare Pages Function — `functions/[[path]].js`
A catch-all that runs at the edge:
1. **Static passthrough** — requests for real files (`*.css`, `*.js`, `/guides/*.json`, `/assets/*`,
   favicon) are served as-is.
2. **App routes** (`/`, `/<guide>`, `/<guide>/<place>`) — fetch the static `index.html`, then string-
   replace the `<title>`, meta description, canonical URL, and `og:`/`twitter:` tags using the
   manifest + that guide's JSON, and return the modified HTML.
   - Gives correct previews to crawlers **and** humans without user-agent sniffing (FR-26), and
     doubles as the SPA deep-link fallback so `/raleigh/boulted-bread` returns the shell instead of a
     404.
   - Unknown guide → inject the default guide's meta.
   - Previews are **guide-level**, including for place URLs (FR-28) — no per-place meta needed.
   - `og:image` ← `guide.ogImage` else `/assets/og/default.png`.

## Rendering module (replaces the inline content script)
On load:
1. Parse route → guide (+ optional place).
2. Fetch `guides/index.json` and `guides/<slug>.json` in parallel.
3. **Apply accent**: set `--accent` from `guide.accent` (see Theming note).
4. **Render** into today's DOM structure/classes (so `style.css` is largely reused):
   header (title + dropdown, intro), sticky nav (one anchor per section), `<main>` (sections →
   `.section`/`.section-head`, with `style:"highlight"` adding the `.shortlist` modifier class;
   subsections → `.section-group`/`.subsection-head`; places → `.card` with `id="place-<slug>"`,
   `data-section`/`data-lat`/`data-lng`). The Short List is simply a section with `style:"highlight"`.
5. **Build the map** from rendered place cards — markers colored via the place's **section** color,
   clustering, tooltips, legend (one entry per top-level section), card↔pin two-way linking, and
   geolocation. This is today's logic (`index.html:1054-1229`) moved into functions invoked after
   render. One pin per place — no ref/shortlist dedup needed.
6. **Wire interactions**: free-text search (name + description, FR-21) and **filter chips** (section +
   tag) with **conjunctive AND** semantics (FR-23); live count + empty state (FR-25); chips toggle off
   individually and search clears via the native input control — **no reset button** (FR-24).
7. If the route includes a place slug, **focus** it: scroll to its card, flash it, show its pin.

On **guide switch** (dropdown): `pushState` to `/<slug>`, fetch the new guide JSON, re-render
header/nav/`main`, rebuild the map (clear cluster + bounds), re-apply accent, reset scroll. Theme
persists (FR-29).

**Reused as-is:** the `<head>` pre-paint theme script (`index.html:9-18`) and the theme-toggle script
(`index.html:1233-1280`) — already generic.

## Styling additions (`style.css`)
- `--accent` is already a custom property (`style.css:6`). JS sets it per guide on `:root`. **Dark-mode
  note:** dark theme defines its own brighter `--accent` (`style.css:23`); for v1, apply the guide
  accent to the light theme and keep the existing dark accent (simplest, guaranteed contrast). A
  per-guide dark accent can come later.
- **Per-section style** (FR-31a): today's `.shortlist .card` rule (`style.css:421-425`) becomes the
  `"highlight"` style, applied to any section whose JSON sets `style:"highlight"` (not just a list
  named "Short List"). Room to add more style variants later.
- New: filter-chip styles (pill button + active state), and the inline title dropdown (accessible
  `button[aria-haspopup]` + menu, styled to read as part of the `<h1>`).
- Remove the `.filter-reset` button markup/styles (FR-24).

## Migration — Raleigh → `melsom-guides/guides/raleigh.json`
- A **one-way copy** out of `raleigh-ttd` (read-only on the source repo; it is not modified).
- Convert every current card into sections: **Short List**, **Baby Shower 2026**, **Restaurants**
  (4 groups), **Coffee & Tea**, **Bakeries**, **Ice Cream**, **Attractions** (3 groups). Each
  top-level section gets a `color` (pins + legend); reuse today's category colors
  (`index.html:1043-1049`) for the food/coffee/etc. sections and pick colors for Short List and Baby
  Shower.
- **Only the Short List sets a `style`** (`"highlight"`). Every other section sets just a `color` and
  no `style` — they render with default cards. (Per-section `style` is a capability; in this guide
  only the Short List uses it.)
- **One section per place** (FR-13), resolved placements:
  - **Iris Coffee Lab, Boulted Bread, NC State Farmers Market → Short List only** (removed from
    Coffee / Bakeries / Attractions).
  - **Sam Jones BBQ → Baby Shower 2026 only** (removed from Casual & Quick).
- **Drop city labels** (per decision). Define `tags` `breakfast`/`kids`. `accent` = `#0F766E`. No
  per-place `category` field — color comes from the section.
- Derive each `slug` from today's `id="place-…"` (strip the `place-` prefix) so it's stable.
- Add a Raleigh preview image at `/assets/og/raleigh.png` and set `ogImage` to it (reuse the current
  `og-image.png` as the starting point).
- Write a **fresh `CLAUDE.md` in `melsom-guides`** (raleigh-ttd's is left as-is): document the JSON
  authoring workflow, the schema, how to add a place/guide, the Cloudflare Pages deploy, and the
  previews Function.

## Repository & hosting / deploy
- All new work lives in a **new, public repo `melsom-guides`** (these `specs/` files relocate there as
  their home). The existing **`raleigh-ttd` repo is left untouched** and stays live at its current
  GitHub Pages URL — the two coexist; no deprecation or redirect for now.
- Seed `melsom-guides` by **copying** `style.css` and the reusable JS (map/search/theme) from
  `raleigh-ttd` as a base (read-only on the old repo).
- Connect **`melsom-guides`** to **Cloudflare Pages**: build command **none**, output dir = repo root;
  auto-deploy on push. Map `melsom.guide` (+ `www` redirect); DNS already on Cloudflare.
- **Local dev:** `npx wrangler pages dev .` exercises the Function (routing + meta). Plain
  `python3 -m http.server` renders the SPA but skips meta injection.

## Verification
- **Routes:** `/`, `/raleigh`, `/raleigh/boulted-bread` render; unknown guide → default; back/forward
  works.
- **Switching:** dropdown changes guide with no reload, URL updates, map rebuilds, accent changes,
  theme persists.
- **Search/filter:** AND across search + chips; live count; empty state; per-chip toggle + native
  search clear; no reset button.
- **Map:** one pin per place; legend matches the guide's top-level sections and colors; clustering,
  card↔pin linking, and geolocation intact; auto-frames the guide.
- **Previews:** `curl -s <host>/raleigh | grep -i '<title>\|og:'` shows guide-specific meta; a second
  guide shows its own; static assets pass through untouched.
- **Data integrity:** every place sits in exactly one section; slugs unique within a guide; each
  place's `tags` resolve to declared `tags`.
- **A11y/responsive:** keyboard-operable dropdown + chips; usable at ~360px; reduced-motion respected
  (`style.css:513-518`).

## Risks / notes
- Per-guide previews now depend on the Pages Function — acceptable since hosting is moving there; the
  SPA still renders without it (only meta injection is lost).
- Guide-accent vs. dark-theme interaction handled minimally for v1 (see Theming note).
- Render logic grows vs. static HTML; keep it small and mirror the existing code style — the map,
  search, and theme code port over almost verbatim.

## Resolved technical decisions
- **Sections replace categories** — a section carries its own `color` (pins + legend); no top-level
  `categories` array and no per-place `category` field.
- **One section per place** — no `ref`/cross-listing and no `shortlist` array; the Short List is a
  section with `style:"highlight"`. Section `style` is an extensible per-section visual treatment.
- **Per-guide `og:image`** — each guide supplies its own preview image (e.g. `/assets/og/raleigh.png`)
  via its `ogImage` field; `/assets/og/default.png` is the fallback only when a guide hasn't set one.
- **Guide accent** applies to the light theme; dark theme keeps its existing accent for v1.
- **No build step** — vanilla static SPA, per NFR-7.
