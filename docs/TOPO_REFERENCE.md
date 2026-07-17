# NAMRIA Topo Sheet Reference

**Purpose:** document what the 6 official NAMRIA topographic sheets (provided outside the repo, at `C:\Users\valde\Documents\SMNT\Topo\`) contributed to this app's data, what was deliberately left out, and why — so a future session doesn't re-derive this or accidentally reintroduce the licensing problem these sheets carry.

## Source sheets

All published by NAMRIA (National Mapping and Resource Information Authority), 1:250,000 scale, 100m contour interval, PRS92 datum. Together they cover the entire Sierra Madre corridor from Cagayan down to Quezon:

| Sheet | Name | Edition/Date | Lat band |
|---|---|---|---|
| 2504 | Aparri | Ed. 5, Dec 2020 | 18°–19°N |
| 2506 | City of Ilagan | Ed. 1, Dec 2023 | 17°–18°N |
| 2508 | Solano | Ed. 1, Dec 2023 | 16°–17°N |
| 2510 | Laur | Ed. 5, Dec 2022 | 15°–16°N |
| 2511 | City of Manila | Ed. 1, Dec 2022 | 14°–15°N (west side, mostly off-corridor) |
| 2512 | Daet | Ed. 2, Dec 2019 | 14°–15°N (east side; covers Mauban/Infanta/General Nakar/Real) |

## Licensing constraint — why the scans are never displayed

Every sheet's own legend states: *"Reproduction in any form or by any means for commercial purposes is prohibited without written approval from NAMRIA."* SMNT's [CONTEXT.md](./CONTEXT.md) describes ad-monetization plans for the site. **Decision (user-confirmed):** never display or reproduce the scanned map images on the site. Only factual data extracted from them — place names, elevations, province coverage — is used, since facts aren't copyrightable, only the map artifact is restricted. If a raster topo overlay is wanted later, it requires written NAMRIA approval first.

## What was extracted and used

### 1. Province coverage validation (`lib/philippineProvinces.ts`)
Each sheet has an "Approximate Boundaries" panel listing the exact provinces/regions it covers. Cross-referencing all 6 against our corridor confirmed the existing 6-province set (Quezon, Aurora, Nueva Ecija, Quirino/Nueva Vizcaya, Isabela, Cagayan) is complete — no missing provinces. Two boundary edges were corrected using the sheets' own 17°/18°N split (previously guessed at 17.75°N in both directions, tightened to the sheets' actual 18.0°N split — this reclassified "Tabugan Trailhead" from Cagayan to Isabela, matching sheet 2506's coverage).

### 2. Peak name cross-verification
Real mountain names visible on the topo sheets (Mount Tapha, Mount Anacuao, Mount Alegon, Mount Nimananman, Mount Cagagangan, Mount Mingan, etc.) match our GPX file's `peak`-role waypoints by name and approximate position — confirms those waypoints are real, correctly-named, correctly-positioned features, not GPX authoring errors.

### 3. Access notes for a few trailheads (`lib/gpxWaypointAccess.ts`)
Populated **only** where a municipality name and road connection were large and unambiguous on the sheet: Mauban Trailhead (Mauban, Quezon), Umiray Trailhead (near Dingalan, Aurora), Mingan Trailhead (near Gabaldon, Nueva Ecija). The other ~19 real start/exit waypoints are **not yet covered** — an explorer should trust "no access info yet" over a guessed route.

## What was deliberately NOT extracted

**Peak elevations (`lib/gpxPeakElevations.ts` is an empty scaffold).** At the image resolution available for review, the small elevation digits printed next to peak symbols weren't legible with enough confidence to transcribe as fact — misreading one digit (e.g. 1,344m vs 1,844m) would be actively misleading for trip planning, worse than having no number at all. The lookup table and wiring exist and work end-to-end; populating it needs either:
- the finer 1:50,000-scale index sheets referenced in each topo sheet's own legend (higher resolution, larger labels), or
- official NAMRIA control-point/elevation data directly, or
- re-review of these same sheets at higher source resolution than what was available this session.

**Full road-access tracing for all trailheads.** Same resolution/confidence issue, compounded by needing to trace road connectivity across sheet boundaries in some cases. Only the 3 clearest cases were captured (see above).

## How to extend this later
Both `lib/gpxPeakElevations.ts` and `lib/gpxWaypointAccess.ts` are simple `Record<string, value>` lookups keyed by exact waypoint name (see `lib/gpxStructure.ts`'s `analyzeGpx()` output for the canonical name list, currently 38 waypoints). Add entries directly; no other code changes needed — `lib/loadGpxTrail.ts`'s `getGpxWaypoints()` already wires both lookups in.
