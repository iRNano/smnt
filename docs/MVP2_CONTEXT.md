# SMNT Website — MVP 2 (Map Customization)

**Purpose:** Extend the map with a locked Sierra Madre view, interactive sections, and horizontal orientation (North on the left). Builds on [MVP_CONTEXT.md](./MVP_CONTEXT.md); same repo and app.

**Canonical technical reference:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Scope

- **Horizontal viewing:** Map oriented so North is on the left (screenshot style). **Done** (Mapbox `bearing: 90`, rotation toggle).
- **Locked map:** View restricted to the Sierra Madre trail corridor (no free pan outside). **Done** (`setMaxBounds` in [SMNTMapClient.tsx](../app/components/SMNTMapClient.tsx)).
- **Interactive sections:** Trail split into segments; each segment highlightable on hover and clickable to open a section-specific page. **Partial** — pages exist; map layer deferred.

---

## Phase 2A — Locked view + sections (Mapbox)

- Map locked to trail bounds (`fitBounds`, `setMaxBounds`, min/max zoom). **Done.**
- Sections derived from main route waypoints; each section has id, slug, name, from_poi, to_poi, geometry (mock data or future `trail_sections` table).
- Section detail pages at `app/sections/[slug]/page.tsx` with name, description, link back to map. **Done.**
- Sections rendered as a GeoJSON layer on the map; click navigates to `/sections/[slug]`, hover highlights the segment. **Not active** — deferred to Phase E.

---

## Phase 2B — Horizontal view (North on the left)

- **Mapbox GL JS** with `bearing: 90` (or toggled via rotation control); requires `NEXT_PUBLIC_MAPBOX_TOKEN`. **Done.**
- Bounds lock from Phase 2A applies in the rotated view. **Done.**

> **Historical note:** An earlier plan considered Leaflet with a rotate plugin. The app migrated to Mapbox only; do not reintroduce Leaflet.

---

## Success criteria (MVP 2)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Map loads with bounds locked to the Sierra Madre corridor | Done |
| 2 | Main trail split into sections; each section visible and clickable on map | Partial — pages only |
| 3 | Clicking a section navigates to `/sections/[slug]` | Done (direct URL; map layer not wired) |
| 4 | Hovering a section highlights that segment | Deferred |
| 5 | Map displayed with North on the left (horizontal view) | Done |

---

## Real data (terrain extent)

- **Northern Sierra Madre Natural Park (NSMNP)** boundary data exists in [lib/sierraMadreExtent.ts](../lib/sierraMadreExtent.ts). The NSMNP highlight layer is **currently commented out** in the map component. NSMNP is the largest protected area in the Philippines (359,486 ha, Isabela). For precise boundaries, use NIPAS shapefiles (DENR-BMB, foi.gov.ph) or OSM relation 2784140.

## References

- Plan: MVP 2 Map Customization (locked view, sections, horizontal view).
- MVP 1: [MVP_CONTEXT.md](./MVP_CONTEXT.md). [UI_UX_FLOW.md](./UI_UX_FLOW.md).
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md).
