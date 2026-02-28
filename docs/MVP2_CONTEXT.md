# SMNT Website — MVP 2 (Map Customization)

**Purpose:** Extend the map with a locked Sierra Madre view, interactive sections, and optional horizontal orientation (North on the left). Builds on [MVP_CONTEXT.md](./MVP_CONTEXT.md); same repo and app.

---

## Scope

- **Horizontal viewing:** Map oriented so North is on the left (screenshot style).
- **Locked map:** View restricted to the Sierra Madre trail corridor (no free pan/zoom outside).
- **Interactive sections:** Trail split into segments (e.g. Start–Point A, Point A–Point B); each segment is highlightable on hover and clickable to open a section-specific page.

---

## Phase 2A — Locked view + sections (Leaflet)

- Map locked to trail bounds (fitBounds, setMaxBounds, optional min/max zoom).
- Sections derived from main route waypoints; each section has id, slug, name, from_poi, to_poi, geometry.
- Sections rendered as a GeoJSON layer; click navigates to `/sections/[slug]`, hover highlights the segment.
- Section detail pages at `app/sections/[slug]/page.tsx` with name, description, link back to map.

---

## Phase 2B — Horizontal view (North on the left)

- **Option A (recommended):** Mapbox GL JS with `bearing: 90` (or -90); requires `NEXT_PUBLIC_MAPBOX_TOKEN`.
- **Option B:** Leaflet rotate plugin so the map can be rotated; if plugin is brittle, fall back to Mapbox.

Bounds lock and section interactivity from Phase 2A apply in the rotated view.

---

## Success criteria (MVP 2)

1. Map loads with bounds locked to the Sierra Madre corridor (user cannot pan outside).
2. Main trail is split into sections; each section is visible and clickable.
3. Clicking a section navigates to `/sections/[slug]` with section name and description.
4. Hovering a section highlights that segment.
5. (Phase 2B) Map can be displayed with North on the left (horizontal view).

---

## References

- Plan: MVP 2 Map Customization (locked view, sections, horizontal view).
- MVP 1: [MVP_CONTEXT.md](./MVP_CONTEXT.md). [UI_UX_FLOW.md](./UI_UX_FLOW.md).
