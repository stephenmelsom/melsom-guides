# melsom.guide

A static, single-page site hosting our favorite-places guides for multiple locations
(Raleigh, and more to come) — made to share with friends and family.

- **Live:** https://melsom.guide (Cloudflare Pages)
- Each location is a guide reachable at its own path, e.g. `/raleigh`. The location in the title is a
  dropdown for switching guides.

This is a generalization of the original single-location
[`raleigh-ttd`](https://github.com/stephenmelsom/raleigh-ttd) page, which remains live and untouched.

## How it works

- No build step. Plain `index.html` + `style.css` + a small render script, plus Leaflet (CDN) for the
  map. The only new runtime piece is a Cloudflare Pages Function for per-guide link previews.
- Content lives in **`guides/*.json`** — one file per location, listed in `guides/index.json`. The
  page renders both the cards and the map markers from that JSON.

## Specs

Design lives in [`specs/`](./specs):

- [`PRD-melsom-guide.md`](./specs/PRD-melsom-guide.md) — product / features
- [`REQUIREMENTS-melsom-guide.md`](./specs/REQUIREMENTS-melsom-guide.md) — functional + non-functional requirements
- [`TECH-SPEC-melsom-guide.md`](./specs/TECH-SPEC-melsom-guide.md) — architecture, data model, routing, deploy

## Develop & preview

```sh
# Full fidelity (runs the Pages Function: routing + per-guide previews):
npx wrangler pages dev .

# Plain static (renders the SPA, skips meta injection):
python3 -m http.server   # then visit http://localhost:8000
```

## Status

v1 live at [melsom.guide](https://melsom.guide) — Raleigh guide with 67 places across 7 sections.
Add a place by editing `guides/raleigh.json`. Add a new guide by creating `guides/<slug>.json` and
adding one entry in `guides/index.json`.
