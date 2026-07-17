# GPX Structure — Requirements & Recommendations

**Purpose:** Define what a contributed GPX file needs to contain (and how it should be tagged) so SMNT can extract a clean track, plus entry/exit points and POIs, without guessing. Written after auditing what the app's parser actually does today — several gaps below are confirmed bugs/gaps, not hypotheticals.

**Audience:** Contributors preparing a GPX for submission; anyone building the GPX tooling/confirmation modal described in [ARCHITECTURE.md](./ARCHITECTURE.md) Phase E.

---

## 1. What the app actually parses today (audit findings)

| File | Reads | Ignores |
|------|-------|---------|
| [lib/parseGpxToLineString.ts](../lib/parseGpxToLineString.ts) (user submissions) | `<trk>/<trkseg>/<trkpt lat lon>` — merges **every** track/segment in the file into one flat `LineString`, 2D only | `<wpt>` waypoints entirely; `<ele>` (elevation); `<trk><name>`/`<desc>`; multiple distinct tracks are silently concatenated |
| [lib/loadGpxTrail.ts](../lib/loadGpxTrail.ts) (authoritative main trail) | Same trkpt merge, plus `<ele>` for the elevation profile | `<wpt>` waypoints entirely — entry/exit points are **100% auto-computed** from an elevation-return-to-baseline heuristic, never from waypoints in the file |

**Confirmed gaps this causes:**

1. **Named waypoints are always discarded.** A GPX with 19 named peaks (`<wpt><name>PEAK 1</name></wpt>`, tested with a real AllTrails export) contributes zero POI data — every marker the app shows is auto-generated and generically labeled ("Entry/exit 260.2 km").
2. **Elevation is dropped on submission.** `SubmitRouteModal`'s re-serialized upload GPX (`app/components/SubmitRouteModal.tsx`) writes `<trkpt lat lon></trkpt>` with no `<ele>` — even if the original file had elevation data, it never survives to the server. A contributor's own elevation profile is never shown anywhere.
3. **Multiple unrelated tracks in one file get silently stitched together.** If a file has two `<trk>` elements (e.g., a two-day exploration, or an accidental multi-route export), today's parser concatenates their points into a single `LineString` — this can create a bogus straight-line "teleport" between disconnected tracks with no warning to the user or admin.

These three are the concrete reasons a "confirm before you store" step (§4) and a validation tool (§3) are worth building before PostGIS goes live — right now, bad structure fails silently.

**Bonus finding while testing the tool in §3 against the real files:** [lib/data/The-Sierra-Madre-Nature-Trail.gpx](../lib/data/The-Sierra-Madre-Nature-Trail.gpx) — the *authoritative* main-trail file already contains **38 real, well-named waypoints** ("Mauban Trailhead", "Mingan Summit", "North NSMNP Exit Trailhead", etc.), all silently discarded by `loadGpxTrail.ts` today. This is likely the fastest path to fixing the "no real named POIs on the map" gap — the data already exists in the repo, it just isn't parsed. Not fixed in this pass (out of scope for the structure/tooling work requested); flagged here since it's a direct, low-effort payoff of building the analyzer.

---

## 2. Recommended GPX structure for contributors

### 2.1 Required (parsing already depends on this)

- At least one `<trk>` containing one `<trkseg>` with **≥ 2** `<trkpt lat="…" lon="…">` points.
- Valid WGS84 (EPSG:4326) coordinates.

### 2.2 Strongly recommended (not enforced today; should become required once §4 ships)

- **`<ele>` on every trackpoint.** Needed for the submission's own elevation profile — currently the biggest silent data loss (finding #2 above).
- **`<trk><name>`.** Used to prefill the route name field; falls back to filename today.
- **One track per file.** If a contributor has a multi-day exploration, prefer separate uploads (or clearly named separate `<trk>` elements — see §2.3) over one file with disconnected segments.
- **Waypoints (`<wpt>`) for anything that isn't just the breadcrumb trail:** trailhead/start, exit/end, summits, campsites, water sources, hazards. Plain GPX has no "role" field, so the analyzer in §3 tries three approaches, in order:
  1. **`<sym>`** (GPX 1.1 standard symbol name) if your GPS app/software sets it — Garmin devices commonly do. Known values: `Trailhead`, `Summit`, `Water Source`, `Campsite`, `Danger Area`, `Parking Area`.
  2. **Name-prefix convention**, for contributors hand-naming waypoints: prefix the `<name>` with a short tag — `START:` / `TH:` (trailhead), `END:` / `EXIT:` (exit), `CAMP:`, `WATER:`, `POI:`, `DANGER:`.
  3. **Name-substring fallback** — matches the naming style already used in the real SMNT authoritative GPX (`"Mauban Trailhead"`, `"Mingan Summit"`, `"North NSMNP Exit Trailhead"`) without requiring any special tagging: a name containing "trailhead" → start, "summit"/"peak" → summit, "exit" → exit (checked first, since a name can contain both "exit" and "trailhead"), "camp"/"campsite" → camp, "water"/"spring" → water, "danger"/"hazard" → danger.
  - Waypoints matching none of the above are still kept as generic POIs, just unclassified — this is expected for a file like an AllTrails numbered-peaks export ("PEAK 1", "PEAK 2", …) with no descriptive role in the name itself.

### 2.3 Multi-track files

If a single file legitimately covers multiple days/segments, give each `<trk>` a distinct `<name>` (e.g., "Day 1 — Jump-off to Camp 1"). The tool in §3 treats same-file multi-track GPX as **separate candidate sections** rather than concatenating them — this is a behavior change from today's silent-merge and should be called out to the contributor.

---

## 3. Validation/structuring tool

**What it does:** given a `.gpx` file, report what's present, what's missing against §2, and what it inferred — without silently guessing in the dark like today's parser does.

Location: [lib/gpxStructure.ts](../lib/gpxStructure.ts) (shared analyzer, usable from both a CLI script and the browser submit flow) — see implementation for the exact `analyzeGpx()` output shape (tracks found, waypoints classified by the §2.2 convention, warnings for each of the three confirmed gaps above, and inferred start/end points when no waypoints exist).

Run it against a file:

```bash
npm run gpx:lint -- "path/to/file.gpx"
```

Output includes: track count and point counts (flags multi-track files instead of silently merging), elevation coverage percentage, classified waypoints (start/end/camp/water/poi/danger/unclassified), and actionable warnings.

This is intentionally a **report, not an auto-fixer** — GPX structure implies real-world claims (this point is the trailhead, this one is a water source) that only the contributor can actually confirm. Auto-rewriting those without a human in the loop would just relocate the "silent guess" problem instead of solving it. That confirmation step is §4.

---

## 4. Confirmation modal (submission flow)

**Why:** so what lands in the database is contributor-confirmed, not silently inferred (the same failure mode as today's elevation-heuristic entry/exit points, just formalized instead of accidental).

**Flow (extends `SubmitRouteModal`):**

1. Contributor drops/selects a `.gpx` file (unchanged).
2. Client runs `analyzeGpx()` (same module as the CLI tool) instead of the current bare `parseGpxXmlToLineString`.
3. **New step:** show a list of candidate points — real waypoints if the file had them (pre-classified by §2.2's convention), or track-endpoint suggestions if it didn't (clearly labeled "suggested — no waypoints found in file"). For each: a pin on the preview map, an editable name, a type dropdown (Start / Exit / Camp / Water / POI / Danger / Other), and a remove button. Contributor can also drop a new pin manually for anything the file didn't capture.
4. Contributor confirms. Only then is the submission (track + confirmed POIs) sent to `/api/routes/upload`.

This is the mechanism that turns "GPX structure recommendations" from a wishlist into actual clean rows in the database — see §5 for how confirmed POIs are stored.

**Implementation status:** shipped in `SubmitRouteModal.tsx`, list-based (name + type dropdown per point, add/remove) rather than draggable pins on the preview map — repositioning a point still requires removing and re-adding it at the route midpoint. Dragging pins to exact coordinates is the natural next improvement but wasn't built in this pass.

---

## 5. Data model implications (feeds PostGIS setup)

Confirmed POIs from §4 need somewhere to land alongside a submission, before that submission is even approved (a rejected route's POIs should be discardable too). See [ARCHITECTURE.md §5.3](./ARCHITECTURE.md#53-target-schema-recommended) for the existing target schema; this adds one piece:

```sql
-- Points confirmed by the contributor during submission (§4), scoped to one submission
CREATE TABLE submission_pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES user_route_submissions(id) ON DELETE CASCADE,
  name text NOT NULL,
  poi_type text NOT NULL CHECK (poi_type IN ('start', 'exit', 'camp', 'water', 'summit', 'poi', 'danger', 'other')),
  geometry geometry(Point, 4326) NOT NULL,
  source text NOT NULL DEFAULT 'contributor' CHECK (source IN ('contributor', 'inferred')),
  created_at timestamptz DEFAULT now()
);
```

On approval, `start`/`exit` rows can seed `entry_exit_pois`-equivalent data for that trail, and `poi`/`camp`/`water`/`danger` rows can be promoted into the main `pois` table with `poi_type` mapped accordingly (below) — both promotions are admin-reviewed, not automatic, consistent with how route approval already works.

### 5.1 POI vocabulary mapping

Two different `poi_type` vocabularies exist and don't currently talk to each other — worth fixing before that promotion step above is actually built, so it isn't guessing at the mapping later:

| `submission_pois.poi_type` (this doc, §2.2) | `pois.poi_type` (existing v1 table, [scripts/schema-and-seed.sql](../scripts/schema-and-seed.sql)) |
|---|---|
| `start` | `jump_off` |
| `exit` | `jump_off` |
| `camp` | *(no equivalent yet — would need adding)* |
| `water` | *(no equivalent yet — would need adding)* |
| `summit` | *(no equivalent yet — would need adding)* |
| `poi` | *(ambiguous — admin picks on promotion)* |
| `danger` | *(no equivalent yet — would need adding)* |
| `other` | *(admin picks on promotion)* |

`pois.poi_type` today only has real map-legend meaning for `jump_off`, `supply`, `guides_shed`, `hospital`, `police`, `military` (per [CONTEXT.md](./CONTEXT.md)) — camp/water/summit/danger aren't rendering-ready concepts on the map yet. Promotion should stay a manual admin action until those types have real map treatment, not an automatic mapping.

### 5.2 Known schema wart (not fixed in this pass)

`lib/mapApiBuilder.ts`'s `userRouteFromDbRow` hardcodes `category: "proposed_main"` on every user-submitted route, regardless of what it actually is — a leftover of `TrailRouteRow.category` being a required field with no "not applicable" option for user routes. It's never written to a DB column (`user_route_submissions` has no `category` column), so it doesn't corrupt stored data, but it's a misleading in-memory value if anything ever queries/logs it expecting a real category. Fixing properly means making `TrailRouteRow.category` optional and threading that through every call site that reads it — flagged here rather than done, since it's unrelated to the GPX/POI work this pass focused on.

---

## References
- [ARCHITECTURE.md](./ARCHITECTURE.md) — target schema, migration phases
- [lib/gpxStructure.ts](../lib/gpxStructure.ts) — analyzer implementation
- [scripts/gpx-lint.ts](../scripts/gpx-lint.ts) — CLI tool (`npm run gpx:lint -- <file>`)
