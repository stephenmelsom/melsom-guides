# PRD: melsom.guide — multi-location guides

## Problem / context

We have a single shareable page of favorite spots around Raleigh & Cary — the places we send friends
and family. It works well, but it's locked to one location. We've lived in / traveled to other places
worth recommending (DC, hometown, …) and want to publish a guide for each, under one home:
**melsom.guide**.

The product should keep the simple, fast, single-page feel — a list of recommendations with an
interactive map — but let visitors pick *which place's guide* they're looking at. The "Raleigh" in
the title `The Melsom Guide to Raleigh` becomes a way to switch between guides.

## Goals
- One home (melsom.guide) hosting **multiple location guides**, each with its own shareable link.
- Visitors can **switch guides** seamlessly from the title without losing the single-page feel.
- Each guide keeps everything that makes the Raleigh page good: categorized cards, an interactive map,
  search, light/dark themes, a "Short List" of favorites, and the ability to add a custom one-off
  section (like the current "Baby Shower 2026").
- Sharing a guide link shows a preview for **that specific guide**.
- Adding a new guide is low-effort for the owner.

## Non-goals
- No public/multi-author editing, accounts, comments, or ratings.
- No e-commerce, reservations, or live data (hours, wait times).
- Not changing the editorial voice or visual identity — same look and feel.

## Users
- **Visitor** (friends/family, and friends-of-friends a link gets forwarded to): opens a guide,
  browses the sections and the map, searches, maybe switches to another city we've covered, and
  shares the link.
- **Owner** (us): writes and maintains guides; wants adding a place or a whole new guide to stay quick
  and pleasant.

---

## Features

### F1 — Multiple guides under one site
Each location is its own guide (Raleigh first; DC, hometown, … later). Guides are **fully
self-contained**: their own title, intro, sections, places, and map. A place belongs to exactly one
guide — nothing is shared across guides. Only guides with real content appear in the switcher (no
"coming soon" placeholders).

### F2 — Guide switcher in the title
The location word in `The Melsom Guide to ⟨Raleigh ▾⟩` is an inline dropdown. Opening it lists the
available guides; choosing one switches the whole page to that guide without a jarring full reload,
and updates the page link so it can be shared/bookmarked. Browser back/forward returns to the previous
guide.

### F3 — Per-guide shareable links & previews
Every guide has its own link (e.g. `melsom.guide/raleigh`). Pasting that link into iMessage/Slack/etc.
shows a preview (title, description, image) for **that guide**, not a generic one. Visiting the bare
home link shows a default guide (Raleigh) so there's never an empty landing.

### F4 — Carry over the existing guide experience (per guide)
Everything the Raleigh page does today should work within each guide:
- **Cards** with modifier pills (e.g. *Breakfast*, *Kids*), each linking to a website and to Google
  Maps. (No city labels — the map and the Maps link convey where a place is.)
- **Per-guide sections.** Each guide defines its own sections — a beach town can have "Beaches", a
  city "Nightlife" — rather than being forced into one fixed set. A section *is* the grouping: it
  determines a place's map pin color and the legend (there is no separate "category" concept). Each
  place lives in exactly one section.
- **Interactive map** with pins color-coded by section, clustering, a legend, and two-way linking
  (click a card → highlight its pin; click a pin → jump to its card). Map frames the guide's places.
- **Search** that narrows both cards and map by name/note.
- **Light / Dark / Auto theme**, remembered across visits and across guide switches.
- **Per-section styling.** A section can opt into a visual treatment — e.g. the highlighted
  "Short List" look — so a guide can spotlight its must-sees. The Short List is just a section with
  that style, not a special entity.
- **Custom one-off sections** — like "Baby Shower 2026" — so a guide can spotlight an event or theme.
- **"You are here"** location on the map when allowed.

### F5 — Light per-guide personality
Guides share one overall design and layout, but each can carry a light touch of its own — its own
accent color — so Raleigh and DC feel distinct without being separate designs. No hero images (they'd
just add noise); editorial voice and structure stay consistent.

### F6 — Low-effort authoring
Adding a place, or spinning up a whole new guide, should be a small, self-contained edit — no
duplicated bookkeeping and no risk of a place and its map pin drifting out of sync (a pain point
today). The exact authoring format is a tech-spec concern; the requirement here is that it stays
simple and that one guide's content never touches another's.

### F7 — Filter chips
On top of the existing free-text search, the guide offers tappable filters for section and tag
(e.g. *Kids*, *Breakfast*). Selecting chips narrows both the cards and the map in step; tapping a
chip off removes that filter, and search clears via the search box's own control. This keeps a larger
guide easy to navigate.

### F8 — Share a single place
A visitor can link directly to one place (not just the whole guide), so a "you have to go here" link
opens with that place in focus — scrolled to, highlighted, and shown on the map. The link is
shareable and bookmarkable.

---

## Resolved feature decisions
- **Sections:** per-guide; a section defines pin color + legend (no separate "category"); each place
  lives in exactly one section — F4.
- **Per-section styling:** sections can opt into a visual treatment (e.g. the Short List highlight);
  the Short List is just a styled section, not a special entity — F4.
- **Discovery:** the title dropdown is the only switcher; no separate "all guides" view — F2.
- **Personality:** light per-guide personalization within a shared design — F5.
- **Browsing:** filter chips (section/tag) plus single-place deep links — F7, F8.
- **Scope:** guides are fully self-contained; no shared places; only ready guides are listed — F1.

## Success / done (v1)
- Raleigh guide live at melsom.guide (and its own path), identical in feel to today.
- The title dropdown and guide-switching work, ready for more guides — a second guide is **not**
  required to ship.
- Sharing a guide's link shows that guide's preview.
- Adding a place to a guide is a one-spot edit; adding a guide doesn't touch existing ones.

---

*Out of scope for this PRD (deferred to a follow-up tech spec): hosting, routing, data format, and how
per-guide link previews are produced.*
