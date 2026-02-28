# SMNT Website — Project Context

**Source:** *The Impossible is Always Doable 2024* (vision document)  
**Purpose:** A website for SMNT that advertisers would be excited about, acting as an info hub for trekkers and increasing SMNT capabilities.

---

## 1. Vision & Goals

- **Advertiser-focused:** Each web page is an opportunity for advertisers; main page is the priciest. Every lecture/event is an opportunity for advertising banners.
- **National call:** Website should grow viral as a “National Call” — *“SMNT is our next Everest!”* (inspired by [Great Himalayan Trail](https://www.trekkingteamgroup.com/blog/the-great-himalayan-trail-)).
- **Capability multiplier:** The site will increase SMNT capabilities tenfold.
- **Younger audience:** UX and interactive map target the younger generation.

---

## 2. Core Feature: Interactive Map

The SMNT website **opens to an interactive map**. Map is positioned **horizontally** (left-to-right) for economic and reading-habit reasons.

### 2.1 Routes

- **Real-time GPX route input** from anyone, subject to confirmation (badge/icon after “ocular” verification in a month).
- **Route types & colors:**
  - **Green** — Main route
  - **Orange** — Exit routes
  - **Red** — Not passable or not explored yet
  - **User input color** — For user-contributed routes (vs existing trail)
- **Route credits:** Mouse-over on routes shows list of explorers (e.g. MFPI, UPM) for instant gratification; encourages urgency and competition so everyone can be “bida” (hero).
- **Route maker / tools:** Integration or guidance for Google Map, All Trails, Osmand.

### 2.2 Map Features

- **Active Expedition Locator** — Participants can share location.
- **Gradient classification:** Color-coded (e.g. light orange = gradual, solid orange = steep).
- **POIs:** Supply stations, Guides Association shed, Hospital, Police, Military markers.
- **Flora & fauna:** Locations of identified unique flora and fauna with **special validated access**.
- **Jump-off guides:** “How to get there” guide on every jump-off.
- **Participating organizations:** List on the map / site.

### 2.3 Info Hub Role

- Act as **info hub** for interested SMNT trekkers.
- **Donor’s page.**

---

## 3. Content & Resource Links

- Request forms: **BMC, AMC, First Aid, BLS, MSAR** training.
- **Itemized expenses request** form for exploring team.
- **Explorer’s Kit Request** (Maps, Guides, Tips).
- **Password-protected resources** (e.g. letterheads).
- **SAR operations** — Website will be used for Search and Rescue operations.
- **GoFundMe** link.
- **Accredited guides** per area — online registration and list.
- **Climb Report Form**.
- Standard web pages: About, Contact Us, **Monthly Financial Report**, “Boring messages.”

---

## 4. Trophy / Legacy

- Every Manila university-based mountaineer can leave a mark on SMNT as their **“trophy.”**

---

## 5. Recommended Tech Stack

| Layer        | Technology   | Notes                                                |
|-------------|--------------|------------------------------------------------------|
| Frontend    | **Next.js**  | App Router, SSR/SSG, API routes, good for SEO/ads   |
| Database    | **PostgreSQL** | Relational data: users, routes, orgs, reports   |
| Geospatial  | **PostGIS**  | Store and query routes (GPX), POIs, gradients, geometry |

### Why this stack

- **Next.js:** Single codebase for site + API; easy to add ad slots per page; great DX and deployment (e.g. Vercel).
- **PostgreSQL:** Reliable, supports roles, forms, reports, and future scaling.
- **PostGIS:** Essential for the interactive map — routes as linestrings, POIs as points, spatial queries (e.g. “routes near this jump-off”), and integration with map libraries (e.g. Mapbox, Leaflet).

---

## 6. Key Terms (Glossary)

- **SMNT** — Sierra Madre / trail system in scope.
- **GPX** — GPS Exchange Format (routes/tracks).
- **Ocular** — On-the-ground verification before a route gets a badge.
- **Jump-off** — Starting point for a trek.
- **BMC** — Basic Mountaineering Course.
- **AMC** — Advanced Mountaineering Course.
- **BLS** — Basic Life Support.
- **MSAR** — Mountain Search and Rescue.
- **SAR** — Search and Rescue.

---

## 7. Reference

- Vision document: *The Impossible is Always Doable 2024* (18 slides).
- Inspiration: Great Himalayan Trail concept (link in doc).
