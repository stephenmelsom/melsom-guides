---
name: add-place
description: Use this skill whenever the user wants to add a new place, restaurant, coffee shop, bakery, ice cream spot, attraction, or any venue to a guide. Triggers on phrases like "add X to the guide", "add a new place", "add this restaurant", "put X in the Raleigh guide", "add X to the coffee section", etc.
version: 1.0.0
---

# Add Place to Guide

This skill adds a new place (restaurant, café, attraction, etc.) to a melsom-guide JSON file.

## Data model rules (must follow)

- A place lives in **exactly one section** — never duplicated across sections or guides.
- The **section determines the map pin color and legend entry** — there is no per-place `category` field.
- The **slug** is permanent: it forms the shareable URL. Generate it from the name, keep it short and lowercase-kebab-case, and never change it after creation.
- Tags are **only from the guide's own `tags` array** (e.g., `"breakfast"`, `"kids"` in raleigh.json). Don't invent new tags.
- A place with no website should omit the Website link rather than link to a third-party listing.

## Step-by-step workflow

### 1. Gather missing info

Ask the user for anything not already given:
- **Which guide?** (default: raleigh if only one exists)
- **Which section or group?** (show the available sections/groups from the guide JSON)
- **Place name** (required)
- **Their description** (optional — you can draft one from research)

If the user gives a name only, proceed to research before asking more questions.

### 2. Research the place

Use WebSearch to find:
- **Official website URL** — prefer the place's own domain over aggregators (Yelp, TripAdvisor, etc.)
- **Street address** — the full address for the Google Maps link
- **Lat/lng** — search "[place name] [city] coordinates" or derive from the address

Look up the guide JSON to read the existing sections and tags before writing anything.

### 3. Build the place object

```json
{
  "slug": "kebab-case-name",
  "name": "Display Name",
  "tags": [],
  "description": "One or two sentences. Personal, specific, useful to a visitor.",
  "lat": 35.7726,
  "lng": -78.6426,
  "links": [
    { "label": "Website", "url": "https://..." },
    { "label": "Map", "url": "https://www.google.com/maps/search/?api=1&query=<URL-encoded name and address>" }
  ]
}
```

**Slug rules:**
- Lowercase, hyphens only, no punctuation
- Derived from the name: "Iris Coffee Lab" → `iris-coffee-lab`
- Disambiguate if needed: `trophy-brewing-raleigh` vs `trophy-brewing-durham`
- Check the guide JSON to confirm the slug is not already taken

**Google Maps URL:** URL-encode the name + full address as the `query` param:
```
https://www.google.com/maps/search/?api=1&query=Place%20Name%2C%20123%20Main%20St%2C%20City%2C%20ST%2000000
```

**Description style:** Match the tone of existing places in the guide — brief, personal, specific. Avoid filler phrases like "a great place to" or "you'll love". One strong sentence usually beats two weak ones.

**Tags:** Only assign tags that apply. For raleigh.json: `"breakfast"` if it's a breakfast/brunch spot, `"kids"` if kid-friendly. Leave `tags: []` otherwise.

### 4. Determine placement

- If the target section has a flat `places` array → append to it (or insert before a specified place if the user requests ordering).
- If the target section has `groups` → determine which group fits best and append there.
- Ask the user if you're unsure which section or group is right.

### 5. Edit the guide JSON

Edit the relevant `guides/<slug>.json` with the new place object. Maintain the existing indentation (2-space JSON).

After editing, confirm to the user: what was added, which section, and the shareable URL path it'll have (e.g., `/raleigh/iris-coffee-lab`).

## Example

**User:** "Add Boulted Bread to the Raleigh guide bakeries section"

**Research:** finds `https://boultedbread.com/`, address `614 West South St, Raleigh, NC 27603`, lat `35.7726`, lng `-78.6465`

**Result:**
```json
{
  "slug": "boulted-bread",
  "name": "Boulted Bread",
  "tags": [],
  "description": "Best bakery in town — stone-milled breads & pastries.",
  "lat": 35.7726,
  "lng": -78.6465,
  "links": [
    { "label": "Website", "url": "https://boultedbread.com/" },
    { "label": "Map", "url": "https://www.google.com/maps/search/?api=1&query=Boulted%20Bread%2C%20614%20West%20South%20St%2C%20Raleigh%2C%20NC%2027603" }
  ]
}
```
