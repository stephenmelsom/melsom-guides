# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tools

- `gh` cli
- `cf` (Cloudflare Pages local dev / deploy)

## What this is

A static, no-build, single-page site hosting multiple location **guides** (Raleigh, and more to come)
of favorite restaurants, coffee shops, bakeries, ice cream, and attractions — made to share with
friends and family. Served from **melsom.guide** on **Cloudflare Pages**.

This generalizes the original single-location `raleigh-ttd` page (which stays live and untouched). The
full design rationale is in [`specs/`](./specs) — read those before making structural changes.

## Architecture

- **`index.html`** — the shell: head/meta, header (title with the guide dropdown), filters, the map
  container, an empty `<main>`, and the inline render module that builds everything from JSON.
- **`style.css`** — all styling. CSS custom properties at `:root`; per-guide `--accent` override.
- **`guides/index.json`** — manifest: the default guide + the list of guides (drives the dropdown).
- **`guides/<slug>.json`** — one guide. Holds its title/intro, accent, tags, and an ordered list of
  **sections**; each section has a `color` (its map pins + legend) and optional `style`, and contains
  places (or subsection `groups` of places).
- **`functions/[[path]].js`** — Cloudflare Pages Function: serves the SPA shell for app routes and
  injects per-guide `<title>`/`og:` tags so shared links preview correctly.
- **`assets/og/`** — per-guide social-preview images (`default.png` is the fallback).

## The data model (important)

- A **section is the category**: it defines a place's map pin color and the legend entry. There is no
  separate per-place `category` field.
- A **place lives in exactly one section** — never duplicated, never shared across guides. One place →
  one map pin. No cross-listing/`ref` mechanism.
- **Per-section `style`** is an optional capability (v1 value: `"highlight"`, the accent-bordered card
  look). Only sections that opt in get it — e.g. Raleigh's Short List.
- Places carry **no city labels**. Location is conveyed by the map and the Google Maps link.

## Adding or editing a place

Edit the guide's JSON — that's the single source of truth (the map pin is derived, so there's nothing
to keep in sync). Each place needs: `slug` (stable, used in its shareable URL — keep it fixed even if
you rename), `name`, optional `tags`, `description`, `lat`/`lng`, and ordered `links`. Web-search for
the official website + street address when adding.

## Adding a guide

Add `guides/<slug>.json` and one entry in `guides/index.json`. Optionally add
`assets/og/<slug>.png`. Don't touch other guides' files.

## Develop & preview

```sh
npx wrangler pages dev .   # full fidelity: routing + per-guide previews
python3 -m http.server     # plain static; skips meta injection
```

Deploy: push to `main` — Cloudflare Pages redeploys automatically.
