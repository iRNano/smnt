# SMNT Website — UI/UX Flow

**Based on:** [CONTEXT.md](./CONTEXT.md)  
**Audience:** Younger generation; trekkers, explorers, advertisers.  
**Core principle:** Site opens to a **horizontal interactive map**; every page is an ad opportunity.

---

## 1. Site Structure (Information Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SMNT Website                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [HOME]  ───  Interactive Map (primary entry)                               │
│     │                                                                       │
│     ├── Map layer toggles / legend                                          │
│     ├── Route hover → credits (explorers)                                   │
│     ├── POI click → detail (jump-off guide, supply, etc.)                   │
│     └── Ad slot (premium)                                                   │
│                                                                             │
│  [EXPLORE]                                                                  │
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
| **Trekkers (young)** | Plan a trek, see routes, “leave a mark” | Home (map) | Map → route hover → jump-off guide → Explorer’s Kit / training |
| **Explorers / clubs** | Submit route, get credited, compete | Home or Explore | Map → Submit GPX → wait for badge → see name on map |
| **Advertisers** | Visibility on high-traffic pages | Any page | Main page (priciest) > Explore > Resources > Support > Org |
| **Partners / donors** | Support SMNT, see impact | Support / Donors | Donors page → GoFundMe |
| **SAR / ops** | Use site for rescue coordination | Operations | Operations → SAR info / resources |
| **New visitors** | “What is SMNT?” | Home or direct | Home (map) → About → Map again |

---

## 3. Primary User Flows

### 3.1 First-time visitor: Discover SMNT (map-first)

```
Land on HOME (map)
    → See horizontal map, legend (green / orange / red)
    → Hover a route → tooltip: explorer credits
    → Click a POI (e.g. jump-off) → panel/sheet: “How to get there”
    → Click “About” in nav → About SMNT + “National Call” message
    → Return to map or open Explore / Resources
```

**UX notes:** Map is immediately visible; no login required. Legend and one hover interaction teach the color system. CTA for “Submit your route” or “Get Explorer’s Kit” can sit on map or in header.

---

### 3.2 Explorer: Submit a route and get credited

```
HOME or EXPLORE
    → “Submit route” CTA
    → Upload GPX (or link Route maker tools)
    → Submit → confirmation: “Pending ocular verification (~1 month)”
    → (Later) Route appears with “user input” color → after ocular, badge/icon
    → Hover on own route → see name/org in credits (“trophy”)
```

**UX notes:** Clear status (pending vs verified). Badge/icon and credits give “bida” instant gratification. Optional: email when route is verified.

---

### 3.3 Trekker: Plan a trip (jump-off + resources)

```
HOME (map)
    → Use layer toggles: routes, POIs (supply, guides, hospital, etc.)
    → Click jump-off POI → “How to get there” guide
    → (Optional) Active Expedition Locator: see live participants
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

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  MAP CANVAS (horizontal, full-width)                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Layer toggles]   Routes │ POIs │ Gradient │ Flora/Fauna │ Live expeditions │
│                                                                              │
│  ROUTE INTERACTIONS:                                                         │
│  • Hover segment     → Tooltip: route name, explorers (MFPI, UPM, …), date   │
│  • Click segment     → (Optional) Side panel: full credits, link to org      │
│  • Color meaning     → Green main, Orange exit, Red not passable/unexplored   │
│  • Gradient          → Light orange gradual, solid orange steep              │
│                                                                              │
│  POI INTERACTIONS:                                                           │
│  • Click POI         → Bottom sheet or side panel                            │
│      → Jump-off: “How to get there” guide                                    │
│      → Supply / Guides shed / Hospital / Police / Military: name, contact   │
│      → Flora/fauna: short description (validated access note)                │
│                                                                              │
│  LEGEND (persistent):                                                        │
│  Main route │ Exit │ Not passable / Unexplored │ User input │ Existing trail │
│                                                                              │
│  [Ad slot – premium]                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**States to support:** Loading map → Tiles + routes + POIs loaded → Hover/click feedback → Panel open/close. Mobile: same flows; consider bottom sheet for POI and stacked toggles for layers.

---

## 5. Page-Level UX Summary

| Page / section | Primary action | Secondary | Ad slot |
|----------------|----------------|-----------|--------|
| **Home (map)** | View & interact with map | Submit route, Explorer’s Kit | Premium (main) |
| **Explore** | Submit GPX, see Route maker links | Active Expedition Locator | Banner |
| **Resources** | Training & Kit requests, guides, forms | Protected resources (login) | Banner / sidebar |
| **Operations** | SAR info, coordination | — | Banner |
| **Support / Donors** | Donate, GoFundMe | — | Banner |
| **About / Contact / Financial** | Read, contact, transparency | — | Banner |

---

## 6. Visual & Layout Principles

- **Map:** Horizontal (left-to-right) layout; full-width on desktop; primary content above the fold.
- **Younger audience:** Clear typography, high contrast for route colors, quick feedback (hover tooltips, smooth panel open/close). Consider dark mode for map.
- **Ads:** Consistent placement (e.g. top banner, right rail or bottom on mobile) so each page feels like an “opportunity” without hiding content.
- **Navigation:** Persistent header with: Home, Explore, Resources, Operations, Support, About/Org. Footer: Contact, Financial Report, Participating orgs.
- **Mobile:** Map remains central; toggles and POI panels as overlay/sheet; thumb-friendly tap targets.

---

## 7. Key Screens (Flow Overview)

```
[Landing / Home]
     │
     ├─→ [Map view] ── hover route ──→ [Tooltip: credits]
     │         │
     │         └─ click POI ──→ [Panel: Jump-off guide / POI detail]
     │
     ├─→ [Explore] ── Submit GPX ──→ [Confirm: pending ocular]
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

- Detailed wireframes or pixel-level specs.
- Copy and exact form fields (covered in CONTEXT.md / MVP).
- Auth flows (login, roles) — only noted as “password-protected resources” entry.
- API or data structure — see CONTEXT.md tech stack and MVP_CONTEXT.md.

Use this flow with [CONTEXT.md](./CONTEXT.md) and [MVP_CONTEXT.md](./MVP_CONTEXT.md) for implementation and prioritization.
