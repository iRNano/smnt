# SMNT Website — UI/UX Flow

**Based on:** [CONTEXT.md](./CONTEXT.md)  
**Audience:** Younger generation; trekkers, explorers, advertisers.  
**Core principle:** Site opens to a **horizontal interactive map**; every page is an ad opportunity.

**Technical reference:** [ARCHITECTURE.md](./ARCHITECTURE.md) — layer colors, API, and shipped map chrome.

---

## 1. Site Structure (Information Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SMNT Website                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [HOME]  ───  Interactive Map (primary entry)                               │
│     │                                                                       │
│     ├── Map layer toggles / legend (toggles: placeholder today)             │
│     ├── Map GPX button → user route (purple, pending)                       │
│     ├── POI click → popup (jump-off guide, supply, etc.)                    │
│     ├── Elevation profile, corridor, zoom/rotate controls                   │
│     └── Ad slot (premium)                                                   │
│                                                                             │
│  [EXPLORE]  (planned — wireframe only today)                                │
│     ├── Submit GPX route (→ pending ocular / badge)                         │
│     ├── Active Expedition Locator (share location)                          │
│     ├── Route maker links (Google Map, All Trails, Osmand)                  │
│     └── Ad slot                                                            │
│                                                                             │
│  [RESOURCES]                                                                │
│     ├── Training requests (BMC, AMC, First Aid, BLS, MSAR)                  │
│     ├── Explorer’s Kit (Maps, Guides, Tips)                                 │
│     ├── Itemized expenses request                                           │
│     ├── Climb Report Form                                                   │
│     ├── Accredited guides (list + registration)                             │
│     ├── Password-protected resources (letterheads, etc.)                    │
│     └── Ad slot                                                            │
│                                                                             │
│  [OPERATIONS]                                                               │
│     ├── SAR operations (info / coordination)                               │
│     └── Ad slot                                                            │
│                                                                             │
│  [SUPPORT]                                                                  │
│     ├── Donors page                                                        │
│     ├── GoFundMe link                                                      │
│     └── Ad slot                                                            │
│                                                                             │
│  [ORGANIZATION]                                                             │
│     ├── About SMNT                                                         │
│     ├── Participating organizations                                         │
│     ├── Contact Us                                                         │
│     ├── Monthly Financial Report                                           │
│     └── Ad slot                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Personas & Entry Points

| Persona | Goal | Typical entry | Key flow |
|--------|------|----------------|----------|
| **Trekkers (young)** | Plan a trek, see routes, “leave a mark” | Home (map) | Map → POI click → jump-off guide → Explorer’s Kit / training |
| **Explorers / clubs** | Submit route, get credited, compete | Home (map) | Map → GPX button → purple pending line → (future) badge after ocular |
| **Advertisers** | Visibility on high-traffic pages | Any page | Main page (priciest) > Explore > Resources > Support > Org |
| **Partners / donors** | Support SMNT, see impact | Support / Donors | Donors page → GoFundMe |
| **SAR / ops** | Use site for rescue coordination | Operations | Operations → SAR info / resources |
| **New visitors** | “What is SMNT?” | Home or direct | Home (map) → About → Map again |

---

## 3. Primary User Flows

### 3.1 First-time visitor: Discover SMNT (map-first)

```
Land on HOME (map)
    → See horizontal map (North on left), legend (gray / orange / red / purple)
    → See proposed main (gray), corridor, elevation profile
    → Click a POI (e.g. jump-off or entry/exit) → popup: name, description
    → Click “About” in nav → About SMNT + “National Call” message
    → Return to map or open Resources (Explore page planned)
```

**UX notes:** Map is immediately visible; no login required. Legend teaches the color system. Layer toggle pills on home are **visual placeholders** until wired. CTA “Submit route” currently links to About; GPX import is on the map control.

---

### 3.2 Explorer: Submit a route and get credited

**Current (shipped):**

```
HOME (map)
    → Tap map **GPX** control (top-left on map)
    → Select .gpx file
    → Route appears as purple “user input” line (pending style when applicable)
    → With DATABASE_URL + v2 schema: persisted via POST /api/routes/upload
    → Without DB: stored in localStorage for this browser
```

**Future (Phase E — Explore page + verification):**

```
HOME or EXPLORE
    → “Submit route” CTA → dedicated upload form
    → Confirmation: “Pending ocular verification (~1 month)”
    → After ocular: badge/icon; verified main may render green
    → Hover on own route → name/org in credits (“trophy”) — planned
```

**UX notes:** Clear status (pending vs verified) when full workflow ships. Badge/icon and credits give “bida” instant gratification. Optional: email when route is verified.

---

### 3.3 Trekker: Plan a trip (jump-off + resources)

```
HOME (map)
    → Use layer toggles (planned): routes, POIs (supply, guides, hospital, etc.)
    → Click jump-off or entry/exit POI → popup with guide text
    → Use elevation profile + follow-map cursor to scout route
    → (Optional, future) Active Expedition Locator: see live participants
    → RESOURCES
        → Explorer’s Kit Request (Maps, Guides, Tips)
        → Training requests (BMC, AMC, First Aid, BLS, MSAR) if needed
        → Accredited guides list for area
    → (Before climb) Climb Report Form
```

**UX notes:** Map is the hub; Resources is one click away. Forms grouped under Resources with clear labels (BMC, AMC, etc.).

---

### 3.4 Advertiser: Understand placement value

```
Any page
    → Main page = priciest (map view)
    → Lecture/event pages = banner slots
    → Each page has defined ad slots (banner, sidebar, etc.)
```

**UX notes:** Media kit or Contact can explain “Main page”, “Explore”, “Resources” tiers. Placeholders or clear ad zones on every page.

---

## 4. Map Interaction Flow (Detail)

### 4.1 Shipped map chrome

| Element | Location | Behavior |
|---------|----------|----------|
| **GPX** button | Top-left on map | File picker; imports user route (purple) |
| Zoom +/- | Top-left | Map zoom |
| Rotation | Top-left | Toggle bearing (horizontal default) |
| **Elevation profile** | Lower-left overlay | Distance vs elevation; click to place entry/exit POI |
| **Follow-map cursor** | On main route | Draggable marker synced with profile |
| **Corridor** | Map fill | Buffered trail envelope |
| **Zoom / bounds readout** | Map overlay | Current zoom level and bounds |
| **Legend** | Footer below map | Gray proposed main, orange exit, red not passable, purple user, teal existing |

### 4.2 Interaction diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  MAP CANVAS (horizontal, full-width, Mapbox Outdoors)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [GPX] [Zoom] [Rotate]     Layer toggles (placeholder): Routes │ POIs │ …     │
│                                                                              │
│  ROUTE INTERACTIONS:                                                         │
│  • Hover segment     → (Planned) Tooltip: route name, explorers, date        │
│  • Click segment     → (Planned) Side panel: full credits, link to org       │
│  • Color meaning     → Gray proposed main, Orange exit, Red not passable,    │
│                        Purple user input (on top of baseline)                  │
│  • Gradient          → (Future) Light orange gradual, solid orange steep     │
│                                                                              │
│  POI INTERACTIONS (current):                                                 │
│  • Click POI         → Mapbox Popup: name + description                      │
│      → Jump-off: “How to get there” guide (when content present)             │
│      → Entry/exit: from elevation chart or suggested points                  │
│                                                                              │
│  LEGEND (persistent, footer):                                                │
│  Proposed main │ Exit │ Not passable │ User input │ Existing trail           │
│                                                                              │
│  [Elevation profile — lower left]                                            │
│  [Ad slot – premium]                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States to support:** Loading map → Tiles + routes + POIs loaded → Click feedback → Popup open/close. Mobile: same flows; consider bottom sheet for POI and stacked toggles for layers.

---

## 5. Page-Level UX Summary

| Page / section | Primary action | Secondary | Ad slot |
|----------------|----------------|-----------|--------|
| **Home (map)** | View & interact with map; GPX import | Submit route (→ About today), Explorer’s Kit | Premium (main) |
| **Explore** (planned) | Submit GPX, see Route maker links | Active Expedition Locator | Banner |
| **Resources** | Training & Kit requests, guides, forms | Protected resources (login) | Banner / sidebar |
| **Operations** | SAR info, coordination | — | Banner |
| **Support / Donors** | Donate, GoFundMe | — | Banner |
| **About / Contact / Financial** | Read, contact, transparency | — | Banner |

---

## 6. Visual & Layout Principles

- **Map:** Horizontal (left-to-right, North on left); full-width on desktop; primary content above the fold.
- **Younger audience:** Clear typography, high contrast for route colors, quick feedback (popups, smooth panel open/close when panels ship). Dark footer legend on home.
- **Ads:** Consistent placement (e.g. top banner, right rail or bottom on mobile) so each page feels like an “opportunity” without hiding content.
- **Navigation:** Persistent header with: Home, About, Contact, Donors (full IA expands later). Footer: Contact.
- **Mobile:** Map remains central; toggles and POI panels as overlay/sheet; thumb-friendly tap targets.

---

## 7. Key Screens (Flow Overview)

```
[Landing / Home]
     │
     ├─→ [Map view] ── GPX import ──→ [Purple user route]
     │         │
     │         └─ click POI ──→ [Popup: POI detail]
     │
     ├─→ [Explore] (planned) ── Submit GPX ──→ [Confirm: pending ocular]
     │         └─→ [Route maker links]
     │
     ├─→ [Resources] ──→ [Training request] / [Explorer’s Kit] / [Guides] / [Climb Report]
     │         └─→ (Auth) [Password-protected resources]
     │
     ├─→ [Support / Donors] ──→ [GoFundMe]
     │
     └─→ [About] / [Contact] / [Financial Report]
```

---

## 8. Out of Scope for This Flow Doc

- Detailed wireframes or pixel-level specs — see [DESIGN_HIFI.md](./DESIGN_HIFI.md).
- Copy and exact form fields (covered in CONTEXT.md / MVP).
- Auth flows (login, roles) — only noted as “password-protected resources” entry.
- API or data structure — see [ARCHITECTURE.md](./ARCHITECTURE.md) and [MVP_CONTEXT.md](./MVP_CONTEXT.md).

Use this flow with [CONTEXT.md](./CONTEXT.md), [MVP_CONTEXT.md](./MVP_CONTEXT.md), and [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation and prioritization.
