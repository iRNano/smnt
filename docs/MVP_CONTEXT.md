# SMNT Website — MVP Context

**Purpose:** Define what the MVP validates and what is **shipped today**: an advertiser-friendly SMNT site centered on an **interactive map** and basic info hub, using **Next.js**, optional **PostgreSQL + PostGIS**, and **Mapbox GL**.

**Canonical technical reference:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## MVP Vision in One Sentence

A Next.js site that opens to a **horizontal interactive map** showing a **proposed main SMNT route** (gray), **exit routes** (orange), **not passable** segments (red), and **user-imported routes** (purple), with **POI click popups**, elevation profile and corridor overlays, a few **static info pages**, and placeholders for ads.

---

## In Scope — Achieved

### 1. Interactive Map (Home)

- **Single full-width map** (horizontal layout, North on the left) as landing view via **Mapbox GL JS** + react-map-gl.
- **Routes (layer colors):**
  - **Proposed main** (gray `#6B7280`) — from GPX file or `trail_routes` when DB configured.
  - **Exit routes** (orange) — from DB or seed data when available.
  - **Not passable** (red) — sample segment or legend.
  - **User input** (purple `#A78BFA`) — imported via map **GPX** button.
- **Trail corridor** — buffered polygon around main route (Turf).
- **Elevation profile** — lower-left overlay; follow-map cursor on route.
- **POIs:** Click entry/exit or DB POIs → popup with name and description.
- **Map controls:** Zoom in/out, rotation toggle, zoom level and bounds overlay.
- **Legend** on home footer: proposed main, exit, not passable, user input, existing trail.

### 2. Data & Backend

- **Dual runtime** ([ARCHITECTURE.md §3](./ARCHITECTURE.md)):
  - **No `DATABASE_URL`:** `GET /api/map` serves proposed main from [lib/loadGpxTrail.ts](../lib/loadGpxTrail.ts) (authoritative GPX file).
  - **With `DATABASE_URL`:** PostGIS queries; v2 tables when [scripts/schema-v2.sql](../scripts/schema-v2.sql) is applied.
- **Schema v1** ([scripts/schema-and-seed.sql](../scripts/schema-and-seed.sql)): `routes`, `pois`.
- **Schema v2** ([scripts/schema-v2.sql](../scripts/schema-v2.sql)): `trail_routes`, `user_route_submissions`, `trail_sections`, `trail_corridors`.
- **Structured API:** `proposedMain`, `officialRoutes`, `userRoutes`, legacy `routes[]` via [lib/mapApiService.ts](../lib/mapApiService.ts).
- **`POST /api/routes/upload`** — GPX multipart upload to `user_route_submissions` when DB + v2 exist.

### 3. Pages (Minimal)

- **Home** — Map with legend (gray / orange / red / purple).
- **About** — Short “What is SMNT” and “The Impossible is Always Doable” message.
- **Contact** — Placeholder (e.g. email or form stub).
- **Donors** — Simple list or “Coming soon” + one CTA (e.g. GoFundMe link).

### 4. Ads & Monetization (MVP)

- **Placeholder ad slots** on each page to demonstrate “each page is an opportunity for advertisers” and “main page is the priciest.”

### 5. Tech Stack (MVP)

- **Next.js** (App Router) — frontend + API.
- **Mapbox GL JS** + react-map-gl — map rendering (Leaflet removed).
- **PostgreSQL + PostGIS** — optional; routes and POIs when `DATABASE_URL` is set.
- **Turf.js** — corridor, elevation profile, client-side geometry.

---

## In Scope — Partial (MVP+)

- **GPX import:** Map **GPX** button uploads to API when DB is configured; otherwise persists to `localStorage` and renders as purple user route.
- **Section pages:** `/sections/[slug]` exists; interactive section layer on map is **not active** (deferred).
- **Route credits on hover:** Data model supports `explorer_credits`; hover tooltip **not implemented** — POI popup only.

---

## Out of Scope for MVP

- User accounts, login, or password-protected resources.
- Full **Explore** page with dedicated GPX workflow and ocular confirmation UI (Phase E).
- Active Expedition Locator (live participant location).
- Gradient classification (e.g. light orange vs solid orange).
- Flora/fauna layer and special validated access.
- Forms: BMC/AMC, expenses, Explorer’s Kit, Climb Report, guide registration.
- SAR operations usage, accredited guides list.
- Monthly Financial Report, lecture pages, or many ad slots.
- Route maker integration (Google Map, All Trails, Osmand).
- Green **verified main** route styling (reserved for post-ocular workflow).

---

## Success Criteria for MVP

1. **Map loads** with Mapbox token; proposed main (gray), optional exit/not passable, and corridor/profile in GPX mode.
2. **Legend** clearly explains route colors (gray proposed main, purple user input).
3. **Click POI** (entry/exit or DB POI) shows popup.
4. **GPX button** imports a user route (purple line; API or localStorage).
5. **About, Contact, Donors** pages exist; **ad placeholders** are visible.
6. **Stack in use:** Next.js + Mapbox; PostGIS optional with real geometry when `DATABASE_URL` is set.

---

## Suggested MVP Data (Example)

- **Proposed main:** Sierra Madre Nature Trail from GPX or “Crow’s Route” — 20km, credits e.g. UST MC.
- **Exit route:** 1–2 short segments in orange (DB seed).
- **POIs:** 2–3 jump-offs, 1 supply station or Guides shed (names/descriptions can be placeholder).

---

## File / Doc References

- Full product context: [CONTEXT.md](./CONTEXT.md)
- Map architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Map UX phases: [MVP2_CONTEXT.md](./MVP2_CONTEXT.md)
- UI flows: [UI_UX_FLOW.md](./UI_UX_FLOW.md)
- Deploy: [DEPLOY.md](./DEPLOY.md)
