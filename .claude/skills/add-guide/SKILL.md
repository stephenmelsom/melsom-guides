---
name: add-guide
description: Use this skill whenever the user wants to create a new city guide, add a new location/city to the site, or start a guide for a new place. Triggers on phrases like "add a guide for X", "create a new city guide", "start a Portland guide", "make a guide for Nashville", etc.
version: 1.0.0
---

# Add a New City Guide

This skill creates a complete new guide: the JSON file, the manifest entry, and a note about the OG image.

## Architecture recap

- `guides/index.json` — manifest; drives the dropdown. Add one entry here.
- `guides/<slug>.json` — the guide itself. Create this file.
- `assets/og/<slug>.png` — optional social preview image (1200×630). Note if missing.
- `functions/[[path]].js` — already handles per-guide `<title>`/`og:` injection; no changes needed.

## Step-by-step workflow

### 1. Gather what you need

Ask the user for anything not provided:

- **City name** (required) — e.g., "Portland"
- **Slug** — derive from the city name: `portland`. Confirm with user if it's ambiguous (e.g., Portland OR vs ME).
- **Title** — default pattern: `"The Melsom Guide to [City]"`
- **Intro sentence** — one or two lines that appear at the top of the guide page. The user usually has a feel for this; offer a draft if they don't.
- **Accent color** — the guide's brand color; used for the Short List pins and UI accents. If the user doesn't have one, suggest a reasonable default and confirm.
- **Initial sections** — ask which categories they want (restaurants, coffee, bakeries, ice cream, attractions are the standard set from Raleigh). They may want fewer, more, or renamed sections.
- **Any initial places** — they may want to seed it with a few spots now, or leave it empty and add later via `/add-place`.

### 2. Build the guide JSON

Follow this structure exactly. The `sections` array drives everything — map pins, legend, and card layout.

```json
{
  "slug": "<slug>",
  "name": "<City>",
  "title": "The Melsom Guide to <City>",
  "intro": "<One or two sentences for the guide page header.>",
  "description": "<One sentence for og:description / SEO.>",
  "accent": "#<hex>",
  "ogImage": "/assets/og/<slug>.png",
  "tags": [],
  "sections": []
}
```

**Tags** — only define tags if there are cross-section filters worth exposing (e.g., `"breakfast"`, `"kids"`). Leave `[]` for a new guide until the user knows what filters they want.

**Sections** — each section needs:
```json
{
  "id": "kebab-case-id",
  "title": "Display Title",
  "blurb": "One sentence shown under the section heading.",
  "color": "#hex",
  "places": []
}
```

Use `"groups"` instead of `"places"` when a section has sub-categories (like Restaurants → Breakfast & Brunch, Asian & Sushi, etc.):
```json
{
  "id": "restaurants",
  "title": "Restaurants",
  "blurb": "...",
  "color": "#e74c3c",
  "groups": [
    {
      "title": "Breakfast & Brunch",
      "blurb": "...",
      "places": []
    }
  ]
}
```

Add `"style": "highlight"` to the Short List section (if the guide has one) to get the accent-bordered card look.

**Section colors** — use distinct, readable colors. The Raleigh palette for reference:
- Short List: matches accent (e.g., `#0F766E`)
- Restaurants: `#e74c3c`
- Coffee & Tea: `#795548`
- Bakeries: `#d97706`
- Ice Cream: `#db2777`
- Attractions: `#2563eb`

### 3. Write the guide file

Create `guides/<slug>.json` with the completed JSON. If the user provided initial places, add them following the place format from the data model (slug, name, tags, description, lat/lng, links). For lat/lng and addresses, use WebSearch.

### 4. Update the manifest

Add one entry to `guides/index.json`:

```json
{ "slug": "<slug>", "name": "<City>", "title": "The Melsom Guide to <City>" }
```

The guide dropdown and routing are driven by this file — the new city will appear automatically once this entry exists.

### 5. Note the OG image

The guide will work without `assets/og/<slug>.png` — it falls back to `assets/og/default.png`. Tell the user:

> No OG image yet — the guide will use the default social preview. Add `assets/og/<slug>.png` (1200×630 px) whenever you're ready.

### 6. Confirm what was created

Tell the user:
- The file path created (`guides/<slug>.json`)
- That `guides/index.json` was updated
- The guide URL it'll be served at (`/<slug>`)
- Whether there's an OG image or it's using the default
- How to add places: "Use `/add-place` to populate sections."

## Minimal starter example

A valid but empty guide for Portland:

```json
{
  "slug": "portland",
  "name": "Portland",
  "title": "The Melsom Guide to Portland",
  "intro": "Our favorite spots around Portland — the places we send friends and family to.",
  "description": "Our favorite restaurants, coffee shops, and attractions in Portland, OR.",
  "accent": "#0369A1",
  "ogImage": "/assets/og/portland.png",
  "tags": [],
  "sections": [
    {
      "id": "short-list",
      "title": "Our Short List",
      "blurb": "The places we keep coming back to.",
      "color": "#0369A1",
      "style": "highlight",
      "places": []
    },
    {
      "id": "restaurants",
      "title": "Restaurants",
      "blurb": "",
      "color": "#e74c3c",
      "places": []
    },
    {
      "id": "coffee-and-tea",
      "title": "Coffee & Tea",
      "blurb": "",
      "color": "#795548",
      "places": []
    }
  ]
}
```
