# Requirements: melsom.guide — multi-location guides

Derived from [PRD-melsom-guide.md](./PRD-melsom-guide.md). This spec states *what the system must do*
in testable terms. It stays implementation-agnostic — hosting, routing mechanics, data format, and how
previews are produced are deferred to a follow-up tech spec.

## Glossary
- **Guide** — a self-contained collection for one location (e.g. Raleigh), with its own title, intro,
  sections, places, map, and optional personalization.
- **Section** — an ordered grouping within a guide (e.g. "Restaurants"). Each top-level section defines
  a **color** (its map pins + legend entry) and an optional **style**; may contain **subsections**.
  There is no separate "category" concept — the section *is* the category.
- **Subsection** — a visual sub-grouping inside a section; inherits the section's color (no color of
  its own).
- **Place** — a single recommendation (a card + a map pin). Belongs to exactly one section.
- **Tag** — an optional modifier on a place (e.g. *Breakfast*, *Kids*), shown as a pill and filterable.

## Scope (v1)
- In: F1–F8 from the PRD.
- Out (deferred / future): near-me sort, map-first/full-screen view, price level, photos,
  new/last-updated badges, saved favorites, print/export, PWA/offline, suggest-a-place.
- Ship bar: Raleigh live with the switcher working; a second guide is **not** required.

---

## Functional requirements

### Guides & switching (PRD F1, F2)
- **FR-1** The site shall host multiple independent guides, each with a unique slug and a
  human-readable name.
- **FR-2** Each guide shall be reachable at its own stable, shareable, bookmarkable URL.
- **FR-3** The bare home URL shall load a designated default guide (Raleigh).
- **FR-4** The page title shall show the current guide's name as an inline dropdown listing all
  available guides.
- **FR-5** Selecting a guide shall replace the page content **without a full reload**, update the URL
  to that guide, and reset scroll position to the top.
- **FR-6** Browser back/forward shall move between previously viewed guides (and focused places, per
  FR-24).
- **FR-7** Requesting an unknown/unavailable guide shall fall back to the default guide gracefully (no
  error page).
- **FR-8** Only guides with real content shall appear in the switcher — no "coming soon" placeholders.

### Content model (PRD F1, F4)
- **FR-9** A guide shall consist of an ordered set of sections; a section may contain subsections;
  sections/subsections contain places.
- **FR-10** Each guide shall define its own sections. A top-level section defines a color (used for its
  pins and legend entry) and may declare an optional style; subsections inherit their section's color.
  Sections are not shared or fixed across guides. There is no separate "category" concept.
- **FR-11** Each place shall have: a name, zero or more tags, a description, a geographic location, and
  zero or more outbound links (e.g. Website, Map). A place's map color and grouping come from its
  section. Places carry no city label.
- **FR-12** Outbound links shall render in a defined order; a place may have zero links (no map link)
  or multiple (e.g. two website-style links).
- **FR-13** Each place belongs to **exactly one section** of exactly one guide; places are never
  duplicated or shared across sections or guides.
- **FR-14** A guide may include custom one-off sections (e.g. an event spotlight like "Baby Shower
  2026"), each with its own color and optional style.

### Map (PRD F4)
- **FR-15** The map shall render one pin per place, colored by the place's **section**, with clustering
  when pins are dense.
- **FR-16** The map shall show a legend reflecting the **current guide's** top-level sections and their
  colors.
- **FR-17** Clicking a card shall focus its pin on the map; clicking a pin shall scroll to and
  highlight its card.
- **FR-18** The map shall frame all of the current guide's places by default.
- **FR-19** With the visitor's permission, the map shall indicate their current location ("You are
  here"); denial shall degrade gracefully.
- **FR-20** Because each place lives in exactly one section, the map shall have exactly one pin per
  place (no duplicates).

### Search & filter (PRD F4, F7)
- **FR-21** Free-text search shall match a place's name and description, narrowing cards and pins
  together.
- **FR-22** Filter chips shall be available for section and tag, narrowing cards and pins together and
  combinable with search.
- **FR-23** Filter/search combination is **conjunctive (AND)**: a place is shown only if it matches the
  search text *and* every active chip.
- **FR-24** Search text shall be clearable via the search input's native control; active chips shall
  be clearable by toggling each off. There shall be no combined reset control.
- **FR-25** A live count of matching places shall update as search/filters change; an explicit empty
  state shall appear when nothing matches.

### Sharing & previews (PRD F3, F8)
- **FR-26** Each guide URL shall produce a link preview (title, description, image) specific to **that
  guide**.
- **FR-27** A visitor shall be able to obtain a shareable link to a single place. The link shall be
  **human-readable** (the place identifiable in the URL, e.g. its guide + a readable place slug).
  Opening it shall load that place's guide and bring the place into focus (scroll to it, highlight it,
  show it on the map). A place's slug shall remain stable even if its display name is edited, so
  existing links keep working.
- **FR-28** For v1, a single-place link's preview may be **guide-level** (place-level previews are out
  of scope).

### Theming & personality (PRD F4, F5)
- **FR-29** The site shall support Light, Dark, and Auto themes. An explicit choice shall persist across
  visits and across guide switches; Auto shall follow the system preference.
- **FR-30** A guide may specify a light personalization — its own accent color — within the shared
  overall design; absence falls back to the site default. No hero images.
- **FR-31a** A section may declare an optional style that applies a distinct visual treatment to its
  cards (e.g. the highlighted "Short List" look). The Short List is implemented as an ordinary section
  using this style, not as a special-cased entity. Absent a style, a section renders with the default
  card styling.

### Authoring (PRD F6)
- **FR-31** Adding or editing a place shall be a single-location edit — no duplicated bookkeeping, and
  the map pin shall derive from the place (no risk of card/pin drift).
- **FR-32** Adding a new guide shall not require changes to any existing guide's content.

---

## Non-functional requirements

- **NFR-1 (Performance)** A guide shall load and become interactive quickly on a typical mobile
  connection; payload kept lightweight; the map should not block reading the cards.
- **NFR-2 (Responsiveness)** Layout shall be usable from small phones (~360px wide) up through desktop.
- **NFR-3 (Browser support)** Target current evergreen desktop browsers (Chrome, Safari, Firefox, Edge)
  and modern mobile Safari/Chrome. Older/legacy browsers are not a target.
- **NFR-4 (Accessibility)** Interactive elements — the guide dropdown, filter chips, theme toggle,
  search, and card/map interactions — shall be keyboard-operable with appropriate labels/ARIA, meet
  reasonable color-contrast, and respect reduced-motion preferences.
- **NFR-5 (Privacy)** No accounts, tracking, or PII collection. Geolocation is requested only for the
  map's "You are here" and only with consent.
- **NFR-6 (Discoverability/SEO)** Guides shall be crawlable with correct per-guide title/description/
  preview metadata.
- **NFR-7 (Maintainability)** Preserve the project's simple, hand-editable, zero-ceremony authoring
  ethos; content is human-readable and editable without specialized tooling.
- **NFR-8 (Resilience)** Missing or malformed guide content shall fail gracefully (fall back or skip)
  rather than breaking the page.

---

## Resolved decisions
- **Sections replace categories**: a section defines pin color + legend; each place lives in exactly
  one section; no separate category and no place duplication — FR-10, FR-11, FR-13, FR-15, FR-20.
- **Per-section style**: sections can opt into a visual treatment; the Short List is just a styled
  section — FR-31a.
- Filter/search combine **conjunctively (AND)** — FR-23.
- Single-place links use a **guide-level preview** for v1 — FR-28.
- **No "coming soon"** guides; only ready guides are listed — FR-8.
- Support baseline: **modern mobile + desktop** — NFR-3.
- Personalization is **accent color only** — no hero images — FR-30.
- Single-place links are **human-readable** with a stable per-place slug — FR-27.
- A **second guide is not required** to ship.

## Open questions
- _None — all requirement-level decisions are resolved._
