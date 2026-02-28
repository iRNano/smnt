# SMNT Website — MVP Context

**Purpose:** Define the smallest shippable version that validates the core idea: an advertiser-friendly SMNT site centered on an **interactive map** and basic info hub, using **Next.js + PostgreSQL + PostGIS**.

---

## MVP Vision in One Sentence

A Next.js site that opens to a **horizontal interactive map** showing **one main SMNT route** (green), **exit routes** (orange), and **basic POIs** (e.g. jump-offs, supply stations), with simple **route credits on hover** and a few **static info pages** plus placeholders for ads.

---

## In Scope for MVP

### 1. Interactive Map (Home)

- **Single full-width map** (horizontal layout) as landing view.
- **Routes:**
  - One **main route** (green) — preloaded from DB (PostGIS).
  - **Exit routes** (orange) — at least one example.
  - **Red** = “not passable / not explored” (can be one sample segment or legend-only for now).
- **Route credits:** Hover on a route segment shows **explorer names** (e.g. “UST MC”, “MFPI”, “UPM”) — data from DB.
- **POIs (points):** Jump-offs, 1–2 supply stations or Guides shed — stored in PostGIS, rendered on map.
- **No GPX upload in MVP** — routes are admin/seed data only.

### 2. Data & Backend

- **PostgreSQL + PostGIS:**
  - Tables: `routes` (geometry, type, name, explorer_credits), `pois` (point, type, name, description), optionally `explorers` (name, org).
  - Seed script to load one main route (e.g. “Crow’s Route” / 20km) and a few exit segments + POIs.
- **Next.js API routes** (or server actions) to:
  - Return GeoJSON (or equivalent) for routes and POIs for the map.

### 3. Pages (Minimal)

- **Home** — Map only (with legend: green / orange / red, “Unexplored / User input / Existing trail”).
- **About** — Short “What is SMNT” and “The Impossible is Always Doable” message.
- **Contact** — Placeholder (e.g. email or form stub).
- **Donors** — Simple list or “Coming soon” + one CTA (e.g. GoFundMe link).

### 4. Ads & Monetization (MVP)

- **Placeholder ad slots** on each page (e.g. banner areas with “Ad space” or mock unit) to demonstrate “each page is an opportunity for advertisers” and “main page is the priciest.”

### 5. Tech Stack (MVP)

- **Next.js** (App Router) — frontend + API.
- **PostgreSQL + PostGIS** — routes and POIs only (no users/auth in MVP).
- **Map library** — e.g. Mapbox GL JS or Leaflet with React; consume GeoJSON from API.

---

## Out of Scope for MVP

- User accounts, login, or password-protected resources.
- Real-time GPX upload and “ocular” confirmation workflow.
- Active Expedition Locator (live participant location).
- Gradient classification (e.g. light orange vs solid orange).
- Flora/fauna layer and special validated access.
- Forms: BMC/AMC, expenses, Explorer’s Kit, Climb Report, guide registration.
- SAR operations usage, accredited guides list.
- Monthly Financial Report, lecture pages, or many ad slots.
- Route maker integration (Google Map, All Trails, Osmand).

---

## Success Criteria for MVP

1. **Map loads** with at least one main route (green), one exit (orange), and a few POIs.
2. **Hover on route** shows explorer credits.
3. **Legend** clearly explains route colors.
4. **About, Contact, Donors** pages exist; **ad placeholders** are visible.
5. **Stack in use:** Next.js + PostgreSQL + PostGIS with real geometry (no fake static GeoJSON file only; DB must be source of truth for at least one route).

---

## Suggested MVP Data (Example)

- **Main route:** “Crow’s Route” — 20km, opened by UST MC (e.g. June 3, 2025), members: e.g. “Crow Njjfdk”, “Hdhkdh Udflj”.
- **Exit route:** 1–2 short segments in orange.
- **POIs:** 2–3 jump-offs, 1 supply station or Guides shed (names/descriptions can be placeholder).

---

## File / Doc References

- Full product context: [CONTEXT.md](./CONTEXT.md)  
- Tech stack details: see “Recommended Tech Stack” in CONTEXT.md.
