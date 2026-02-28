# SMNT Website — LoFi Wireframes

**Based on:** [UI_UX_FLOW.md](./UI_UX_FLOW.md)  
**Purpose:** Low-fidelity wireframes for structure and layout. Grayscale, placeholder content, no final visuals.

---

## Global: Shared Layout

Every page shares this shell:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About    [···]  │  ← Header
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           PAGE CONTENT AREA                                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs    │  [Ad slot optional]   │  ← Footer
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Home — Map View

**Primary entry.** Horizontal map full-width; legend and layer toggles; premium ad slot.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                        [Ad slot — premium]                                   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │  [Routes] [POIs] [Gradient] [Flora/Fauna] [Live]     [Submit route] [Kit]   │ │
│ ├─────────────────────────────────────────────────────────────────────────────┤ │
│ │                                                                             │ │
│ │   ······················                                                    │ │
│ │         ······························     ▲                                │ │
│ │   ··············    ◆                        │  MAP CANVAS                   │ │
│ │                    ··············            │  (horizontal, full-width)    │ │
│ │   ◆                    ··············  ◆     │  · = route segments          │ │
│ │         ······················              │  ◆ = POI markers             │ │
│ │   ······················                    ▼                                │ │
│ │                                                                             │ │
│ ├─────────────────────────────────────────────────────────────────────────────┤ │
│ │  Legend: [■] Main  [■] Exit  [■] Not passable  [■] User  [■] Existing      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  (On hover route → tooltip: "Route name · Explorers: MFPI, UPM")                 │
│  (On click POI  → panel opens right/bottom: "How to get there" / POI detail)    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Header (logo + nav)
- Ad banner
- Layer toggles + CTAs (Submit route, Explorer’s Kit)
- Map canvas (placeholder)
- Persistent legend
- Footer

---

## 2. Home — POI / Route Detail Panel (Overlay)

**Opens on POI click or route click.** Side panel (desktop) or bottom sheet (mobile).

```
┌──────────────────────────────────────┬─────────────────────────────────────────┐
│  [Map stays visible, dimmed]         │  [×] Close                              │
│                                      ├─────────────────────────────────────────┤
│                                      │  Jump-off: Brgy. Example                │
│                                      │  ─────────────────────────────────────  │
│                                      │  How to get there                        │
│                                      │  [Placeholder text 2–3 lines]            │
│                                      │  [Get directions]                        │
│                                      │  ─────────────────────────────────────  │
│                                      │  Contact: …                              │
│                                      └─────────────────────────────────────────┘
```

**Route detail variant:** Title, explorer credits (names + orgs), date opened, optional link to org.

---

## 3. Explore

**Submit GPX, Expedition Locator, Route maker links.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                        [Ad slot — banner]                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Submit your route                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Drop GPX file or paste link]                          [Upload] [Submit] │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Status: Pending ocular verification (~1 month). Badge after verification.       │
│                                                                                 │
│  Active Expedition Locator                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Toggle] Share my location on map                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Route maker tools                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                            │
│  │ Google Map   │ │ All Trails   │ │ Osmand       │                            │
│  └──────────────┘ └──────────────┘ └──────────────┘                            │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Resources

**Training requests, Explorer’s Kit, forms, guides, protected resources.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ [Ad — sidebar]                      │ │  Resources                           │ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Training requests                   │ │
│ │                                     │ │  [BMC] [AMC] [First Aid] [BLS] [MSAR]│ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Explorer’s Kit Request              │ │
│ │                                     │ │  [Maps, Guides, Tips]    [Request]   │ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Itemized expenses request           │ │
│ │                                     │ │  [Form link]                         │ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Climb Report Form                    │ │
│ │                                     │ │  [Form link]                          │ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Accredited guides                    │ │
│ │                                     │ │  [List by area] [Register]            │ │
│ │                                     │ │  ─────────────────────────────────  │ │
│ │                                     │ │  Password-protected resources         │ │
│ │                                     │ │  [Login]                              │ │
│ └─────────────────────────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Operations

**SAR info and coordination.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                        [Ad slot — banner]                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  SAR Operations                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [Placeholder: info and coordination content]                            │   │
│  │  Contact / protocol / links                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Support / Donors

**Donors page, GoFundMe.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                        [Ad slot — banner]                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Support SMNT                                                                   │
│  [Short copy: impact, why donate]                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  [GoFundMe — button/link]                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  Donors / recognition (list or “Coming soon”)                                   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. About / Organization

**About SMNT, Contact, Financial Report, Participating orgs.**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] SMNT    Home  Explore  Resources  Operations  Support  About              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │                        [Ad slot — banner]                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  About SMNT                                                                     │
│  [Placeholder: “The Impossible is Always Doable”, National Call, SMNT intro]   │
│                                                                                 │
│  Participating organizations                                                    │
│  [List or cards: UST MC, MFPI, UPM, …]                                         │
│                                                                                 │
│  Contact Us                                                                     │
│  [Email / form placeholder]                                                     │
│                                                                                 │
│  Monthly Financial Report                                                       │
│  [Link to PDF or page]                                                          │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Contact  ·  Financial Report  ·  Participating Orgs                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Mobile — Home (Map) LoFi

**Same content; map central; toggles and panel adapt.**

```
┌─────────────────────────────┐
│ [≡]  SMNT           [···]  │
├─────────────────────────────┤
│ [Ad — compact banner]       │
├─────────────────────────────┤
│ [Routes][POIs][···]  [▼]   │
├─────────────────────────────┤
│                             │
│     MAP CANVAS              │
│     (full width)            │
│     ······  ◆               │
│   ·············             │
│                             │
├─────────────────────────────┤
│ ■ Main ■ Exit ■ Unexplored  │
├─────────────────────────────┤
│ [Submit route] [Kit]        │
└─────────────────────────────┘

(POI click → bottom sheet with “How to get there”)
```

---

## 9. LoFi Component Checklist

| Component           | Home | Explore | Resources | Operations | Support | About |
|--------------------|------|---------|-----------|------------|---------|-------|
| Header + nav       | ✓    | ✓       | ✓         | ✓          | ✓       | ✓     |
| Ad slot            | Premium | Banner | Sidebar   | Banner     | Banner  | Banner |
| Map canvas         | ✓    | —       | —         | —          | —       | —     |
| Layer toggles      | ✓    | —       | —         | —          | —       | —     |
| Legend             | ✓    | —       | —         | —          | —       | —     |
| POI/Route panel    | Overlay | —     | —         | —          | —       | —     |
| Footer             | ✓    | ✓       | ✓         | ✓          | ✓       | ✓     |

---

**View in app:** Run `npm run dev` and open [/wireframes](http://localhost:3000/wireframes) for clickable LoFi screens; [/design](http://localhost:3000/design) for HiFi preview.

**Next:** [DESIGN_HIFI.md](./DESIGN_HIFI.md) for high-fidelity design tokens and screen specs.
