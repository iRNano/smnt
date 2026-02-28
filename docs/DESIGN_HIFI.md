# SMNT Website — HiFi Design Spec

**Based on:** [UI_UX_FLOW.md](./UI_UX_FLOW.md)  
**Purpose:** High-fidelity design tokens, components, and key screen specs for implementation.

---

## 1. Design Principles

- **Map-first:** Home is a horizontal, full-bleed map; minimal chrome so the map feels dominant.
- **Younger audience:** Clear type, high contrast, fast feedback (hover, transitions).
- **Ad-ready:** Consistent ad zones; premium slot on home without overwhelming the map.
- **Accessible:** WCAG 2.1 AA contrast; focus states; touch targets ≥ 44px where possible.

---

## 2. Design Tokens

### 2.1 Color

| Token | Light | Dark (map) | Use |
|-------|--------|-----------|-----|
| `background` | `#FAFAFA` | `#0F1419` | Page / map canvas |
| `surface` | `#FFFFFF` | `#1A1F26` | Cards, panels, header |
| `text-primary` | `#0A0A0A` | `#F5F5F5` |
| `text-secondary` | `#525252` | `#A3A3A3` |
| `border` | `#E5E5E5` | `#2D3748` |
| **Route: main** | `#16A34A` | `#22C55E` | Main route |
| **Route: exit** | `#EA580C` | `#F97316` | Exit routes |
| **Route: not passable** | `#DC2626` | `#EF4444` | Red |
| **Route: user input** | `#7C3AED` | `#A78BFA` | Pending / user |
| **Accent** | `#0D9488` | `#2DD4BF` | CTAs, links |
| **Ad zone** | `#F5F5F5` | `#1E293B` | Ad placeholder bg |

### 2.2 Typography

| Role | Font | Size (px) | Weight | Line height |
|------|------|-----------|--------|-------------|
| **Display** | Geist / system sans | 32–40 | 700 | 1.2 |
| **H1** | Geist / system sans | 24–28 | 600 | 1.3 |
| **H2** | Geist / system sans | 20–22 | 600 | 1.35 |
| **H3** | Geist / system sans | 18 | 600 | 1.4 |
| **Body** | Geist / system sans | 16 | 400 | 1.5 |
| **Small / caption** | Geist / system sans | 14 | 400 | 1.45 |
| **Overline / label** | Geist / system sans | 12 | 500 | 1.4 | Letter-spacing: 0.04em |

### 2.3 Spacing

- **Base unit:** 4px  
- **Scale:** 4, 8, 12, 16, 24, 32, 40, 48, 64, 80  
- **Page padding (desktop):** 24px horizontal; header/footer 16px vertical  
- **Section gap:** 32–48px  
- **Component gap:** 16–24px  

### 2.4 Radius & Shadow

- **Radius:** Card/panel 12px; buttons 8px; inputs 8px; badge 9999px  
- **Shadow (light):** `0 1px 3px rgba(0,0,0,0.08)`; elevated `0 4px 12px rgba(0,0,0,0.1)`  
- **Shadow (dark):** `0 1px 3px rgba(0,0,0,0.3)`; elevated `0 4px 12px rgba(0,0,0,0.4)`  

---

## 3. Components (HiFi)

### 3.1 Header

- **Height:** 56px  
- **Background:** `surface`; border-bottom 1px `border`  
- **Logo:** Left; text “SMNT” or logo mark + wordmark  
- **Nav:** Center or right; links 16px; hover underline or color shift to `accent`  
- **Mobile:** Hamburger; drawer with same nav + optional “Submit route” / “Explorer’s Kit”  

### 3.2 Ad Slot

- **Home (premium):** Full-width banner above map; height ~90px (or 728×90); bg `ad zone`; centered “Ad space” or partner logo  
- **Other pages:** Top banner 728×90 or 320×50 on mobile; sidebar 300×250 on Resources (desktop)  
- **Visual:** Subtle border; optional “Ad” label in small type  

### 3.3 Map Chrome

- **Layer toggles:** Pill group or icon row; active state = filled bg + `accent` or white  
- **Legend:** Horizontal bar below map or floating bottom-left; chips: colored dot + label  
- **CTAs:** “Submit route” primary (accent bg); “Explorer’s Kit” secondary (outline)  

### 3.4 Route Tooltip (hover)

- **Bg:** `surface`; shadow elevated; border 1px  
- **Content:** Route name (H3), list of explorers (small), date  
- **Max-width:** 280px; padding 12px 16px  

### 3.5 POI / Route Detail Panel

- **Desktop:** Right panel 380px width; slide-in; overlay dims map  
- **Mobile:** Bottom sheet 60–80% viewport height; drag handle  
- **Header:** POI name + close (X)  
- **Body:** “How to get there” section; contact; CTA “Get directions”  
- **Route variant:** Title, explorer credits (avatar/name optional), link to org  

### 3.6 Buttons

- **Primary:** Accent bg; white text; hover darken  
- **Secondary:** Outline `border`; text primary; hover bg subtle  
- **Height:** 40px (default), 48px (emphasis); padding 12px 24px  

### 3.7 Forms (Explore, Resources)

- **Input:** Border `border`; focus ring 2px accent; radius 8px  
- **File drop zone:** Dashed border; “Drop GPX or paste link”; accent on drag-over  
- **Links:** Underline or accent color; hover darker  

---

## 4. Key Screens (HiFi Specs)

### 4.1 Home — Map View

- **Above map:** Ad banner (90px) → layer toggles + “Submit route” + “Explorer’s Kit” in one bar (56px).  
- **Map:** Full viewport width; height ≥ 60vh; default view: horizontal (left–right); tiles + routes (green/orange/red) + POI markers (icons).  
- **Legend:** Fixed bottom-left or bottom bar; chips with route colors + “Main”, “Exit”, “Not passable”, “User input”, “Existing”.  
- **Interactions:** Hover route → tooltip; click POI → panel; smooth transitions (200–300ms).  

### 4.2 Explore

- **Hero:** “Submit your route” (H1); subline about ocular verification.  
- **GPX upload:** Large drop zone; “Upload” + “Submit” buttons.  
- **Expedition Locator:** Toggle + short copy.  
- **Route maker:** Three cards or buttons (Google Map, All Trails, Osmand) with icons if available.  
- **Ad:** Banner below hero or top of page.  

### 4.3 Resources

- **Layout:** Two-column on desktop (sidebar ad 300px + main content); single column on mobile with ad on top.  
- **Sections:** H2 per section; training request as chips or buttons; Explorer’s Kit as card with CTA; list of form links; accredited guides (list + “Register”); protected resources (“Login”).  

### 4.4 Support / Donors

- **Headline:** “Support SMNT” or “Donors”.  
- **Short copy:** 2–3 lines impact.  
- **GoFundMe:** Prominent button (primary or custom GoFundMe styling).  
- **Donors list:** Names or “Coming soon”.  

### 4.5 About / Organization

- **About:** Headline “The Impossible is Always Doable”; body copy; “SMNT is our next Everest” quote.  
- **Participating orgs:** Grid or list of logos/names (UST MC, MFPI, UPM, etc.).  
- **Contact:** Email link or simple form.  
- **Financial Report:** Link to PDF or dedicated page.  

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Notes |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape; map full width |
| `md` | 768px | Tablet; nav can stay horizontal |
| `lg` | 1024px | Desktop; sidebar ad on Resources |
| `xl` | 1280px | Wide; max content width optional |

- **Map:** Always full width; height 50vh (mobile) to 70vh (desktop).  
- **Panel:** Right on lg+; bottom sheet below.  
- **Nav:** Hamburger below md unless space allows full nav.  

---

## 6. Motion

- **Panel open/close:** 300ms ease-out; slide from right or bottom.  
- **Tooltip:** 150ms fade + slight translate (e.g. 4px up).  
- **Hover (buttons/links):** 150ms color/opacity.  
- **Prefer `prefers-reduced-motion: reduce`:** Shorten or disable non-essential motion.  

---

## 7. Assets Checklist

- [ ] Logo (light + dark)
- [ ] Favicon
- [ ] POI icons (jump-off, supply, guides, hospital, police, military) or use library
- [ ] Route legend swatches (export or CSS)
- [ ] Optional: illustration for About / empty states

---

**View in app:** Run `npm run dev` and open [/design](http://localhost:3000/design) for the HiFi Home (map) preview.

**Reference:** [WIREFRAMES_LOFI.md](./WIREFRAMES_LOFI.md) for layout structure; [UI_UX_FLOW.md](./UI_UX_FLOW.md) for flows.
