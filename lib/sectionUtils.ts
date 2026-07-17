import along from "@turf/along";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import distance from "@turf/distance";
import length from "@turf/length";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { lineString, point } from "@turf/helpers";
import { getApproximateProvince } from "./philippineProvinces";
import type { PoiRow, SectionRow } from "./mapTypes";

const SECTION_MATCH_DISTANCE_KM = 3;
const SECTION_HIGHLIGHT_BUFFER_KM = 3;
const MAX_MATCH_SAMPLE_POINTS = 300;

type Bbox = [number, number, number, number];

/** Roughly expand a bbox by `km` in every direction (equirectangular approximation, fine at this tolerance). */
function expandBbox(b: Bbox, km: number): Bbox {
  const degLat = km / 111;
  const midLat = (b[1] + b[3]) / 2;
  const degLng = km / (111 * Math.cos((midLat * Math.PI) / 180) || 1);
  return [b[0] - degLng, b[1] - degLat, b[2] + degLng, b[3] + degLat];
}

function bboxesOverlap(a: Bbox, b: Bbox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/** Evenly downsample coordinates so distance-matching doesn't scale with raw GPX point density. */
function sampleCoordinates(coords: GeoJSON.Position[], maxPoints: number): GeoJSON.Position[] {
  if (coords.length <= maxPoints) return coords;
  const step = coords.length / maxPoints;
  const sampled: GeoJSON.Position[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(coords[Math.floor(i * step)]!);
  }
  return sampled;
}

/** Distance (km) along a main trail line from the start to the nearest point on the line to `lngLat`. */
export function chainageKmOnLine(
  mainLine: GeoJSON.LineString,
  lngLat: [number, number]
): number {
  const line = lineString(mainLine.coordinates);
  const snapped = nearestPointOnLine(line, point(lngLat), { units: "kilometers" });
  return snapped.properties.location ?? 0;
}

/** Extract a sub-segment of a line between two chainages (km). */
export function sliceLineByChainage(
  mainLine: GeoJSON.LineString,
  startKm: number,
  endKm: number
): GeoJSON.LineString {
  const coords = mainLine.coordinates;
  if (coords.length < 2) return mainLine;

  const line = lineString(coords);
  const totalKm = length(line, { units: "kilometers" });
  const a = Math.max(0, Math.min(startKm, endKm));
  const b = Math.min(totalKm, Math.max(startKm, endKm));

  const result: GeoJSON.Position[] = [];
  let cum = 0;

  for (let i = 0; i < coords.length; i++) {
    const c = coords[i]!;
    if (i === 0) {
      if (a <= 0) result.push(c);
      continue;
    }
    const prev = coords[i - 1]!;
    const segKm = distance(prev, c, { units: "kilometers" });
    const segStart = cum;
    const segEnd = cum + segKm;

    if (segEnd < a) {
      cum = segEnd;
      continue;
    }
    if (segStart > b) break;

    if (result.length === 0 || segStart >= a) {
      if (segStart < a && segKm > 0) {
        const t = (a - segStart) / segKm;
        result.push([
          prev[0]! + (c[0]! - prev[0]!) * t,
          prev[1]! + (c[1]! - prev[1]!) * t,
        ]);
      } else if (result.length === 0) {
        result.push(prev);
      }
      if (segEnd <= b) {
        result.push(c);
      } else if (segKm > 0) {
        const t = (b - segStart) / segKm;
        result.push([
          prev[0]! + (c[0]! - prev[0]!) * t,
          prev[1]! + (c[1]! - prev[1]!) * t,
        ]);
        break;
      }
    }
    cum = segEnd;
  }

  if (result.length < 2) {
    const startPt = along(line, a, { units: "kilometers" });
    const endPt = along(line, b, { units: "kilometers" });
    return {
      type: "LineString",
      coordinates: [startPt.geometry.coordinates, endPt.geometry.coordinates],
    };
  }

  return { type: "LineString", coordinates: result };
}

/**
 * Build trail sections between entry/exit boundaries projected onto the main line.
 * When `entryExitPois` carry real names (e.g. real trailhead/exit waypoints, not
 * elevation-heuristic guesses), those names are used for from/to instead of the
 * generic "Entry/exit X km" fallback. `peakPois` (optional) are attached to whichever
 * section their chainage falls within, for explorer-facing "what does this section pass"
 * context. Province is approximated per docs/GPX_STRUCTURE.md's "not that accurate but
 * helpful" framing — see lib/philippineProvinces.ts.
 */
export function buildSectionsFromEntryExits(
  mainLine: GeoJSON.LineString,
  entryExitPois: PoiRow[],
  peakPois: PoiRow[] = []
): SectionRow[] {
  if (!mainLine.coordinates || mainLine.coordinates.length < 2) return [];

  const line = lineString(mainLine.coordinates);
  const totalKm = length(line, { units: "kilometers" });

  const kmToName = new Map<number, string>();
  const boundaryKm: number[] = [0, totalKm];
  for (const poi of entryExitPois) {
    const [lng, lat] = poi.geometry.coordinates;
    const km = chainageKmOnLine(mainLine, [lng, lat]);
    boundaryKm.push(km);
    kmToName.set(Math.round(km * 1000) / 1000, poi.name);
  }

  const peakChainages = peakPois.map((poi) => ({
    name: poi.name,
    km: chainageKmOnLine(mainLine, poi.geometry.coordinates as [number, number]),
  }));

  const unique = [...new Set(boundaryKm.map((d) => Math.round(d * 1000) / 1000))].sort(
    (x, y) => x - y
  );

  const sections: SectionRow[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const startKm = unique[i]!;
    const endKm = unique[i + 1]!;
    if (endKm - startKm < 0.05) continue;

    const geometry = sliceLineByChainage(mainLine, startKm, endKm);
    if (geometry.coordinates.length < 2) continue;

    const fromLabel =
      kmToName.get(startKm) ?? (startKm === 0 ? "Trail start" : `Entry/exit ${startKm.toFixed(1)} km`);
    const toLabel =
      kmToName.get(endKm) ?? (endKm >= totalKm - 0.05 ? "Trail end" : `Entry/exit ${endKm.toFixed(1)} km`);

    const peaksInSection = peakChainages
      .filter((p) => p.km >= startKm && p.km <= endKm)
      .map((p) => p.name);

    const secLine = lineString(geometry.coordinates);
    const secLengthKm = length(secLine, { units: "kilometers" });
    const midpoint = along(secLine, secLengthKm / 2, { units: "kilometers" }).geometry.coordinates;
    const firstCoord = geometry.coordinates[0]!;
    const lastCoord = geometry.coordinates[geometry.coordinates.length - 1]!;
    const provinces = [
      ...new Set(
        [
          getApproximateProvince(firstCoord[0]!, firstCoord[1]!),
          getApproximateProvince(midpoint[0]!, midpoint[1]!),
          getApproximateProvince(lastCoord[0]!, lastCoord[1]!),
        ].filter((p): p is string => !!p)
      ),
    ];

    sections.push({
      id: `sec-chainage-${i}`,
      slug: `section-${i}-${Math.round(startKm)}-${Math.round(endKm)}`,
      name: `${fromLabel} → ${toLabel}`,
      from_poi: fromLabel,
      to_poi: toLabel,
      description: null,
      geometry,
      provinces: provinces.length > 0 ? provinces : undefined,
      peaksInSection: peaksInSection.length > 0 ? peaksInSection : undefined,
    });
  }

  return sections;
}

/** Build one section per edge between main-route waypoints (mock / labeled route). */
export function buildSectionsFromWaypoints(
  waypointCoords: GeoJSON.Position[],
  labels?: string[]
): SectionRow[] {
  const names =
    labels ??
    waypointCoords.map((_, i) =>
      i === 0 ? "Start" : i === waypointCoords.length - 1 ? "End" : `Point ${i}`
    );

  const sections: SectionRow[] = [];
  for (let i = 0; i < waypointCoords.length - 1; i++) {
    sections.push({
      id: `sec-wp-${i + 1}`,
      slug: `section-wp-${i}`,
      name: `${names[i]} → ${names[i + 1]}`,
      from_poi: names[i]!,
      to_poi: names[i + 1]!,
      description: null,
      geometry: {
        type: "LineString",
        coordinates: [waypointCoords[i]!, waypointCoords[i + 1]!],
      },
    });
  }
  return sections;
}

export function deriveTrailSections(
  mainLine: GeoJSON.LineString | null,
  entryExitPois: PoiRow[],
  waypointLabels?: string[],
  peakPois: PoiRow[] = []
): SectionRow[] {
  if (!mainLine?.coordinates?.length) return [];

  if (entryExitPois.length >= 2) {
    const fromEntry = buildSectionsFromEntryExits(mainLine, entryExitPois, peakPois);
    if (fromEntry.length > 0) return fromEntry;
  }

  if (waypointLabels && waypointLabels.length >= 2) {
    const step = Math.max(1, Math.floor(mainLine.coordinates.length / waypointLabels.length));
    const waypoints = waypointLabels.map((_, i) => {
      const idx = Math.min(i * step, mainLine.coordinates.length - 1);
      return mainLine.coordinates[idx]!;
    });
    if (waypoints.length >= 2) return buildSectionsFromWaypoints(waypoints, waypointLabels);
  }

  return buildSectionsFromEntryExits(mainLine, entryExitPois, peakPois);
}

/** Sections whose geometry lies within `maxDistanceKm` of any point on the user route. */
export function matchSubmissionToSections(
  userRoute: GeoJSON.LineString,
  sections: SectionRow[],
  maxDistanceKm = SECTION_MATCH_DISTANCE_KM
): SectionRow[] {
  if (!userRoute.coordinates?.length || sections.length === 0) return [];

  const userBbox = bbox(lineString(userRoute.coordinates)) as Bbox;
  const expandedUserBbox = expandBbox(userBbox, maxDistanceKm);
  const sampledUserCoords = sampleCoordinates(userRoute.coordinates, MAX_MATCH_SAMPLE_POINTS);

  const matched: SectionRow[] = [];
  for (const section of sections) {
    if (!section.geometry?.coordinates?.length) continue;

    // Cheap reject: skip sections whose bbox can't possibly be within maxDistanceKm
    // of the submitted route before running any nearestPointOnLine scans.
    const sectionBbox = bbox(lineString(section.geometry.coordinates)) as Bbox;
    if (!bboxesOverlap(sectionBbox, expandedUserBbox)) continue;

    const secLine = lineString(section.geometry.coordinates);
    let hit = false;
    for (const coord of sampledUserCoords) {
      const nearest = nearestPointOnLine(secLine, point(coord));
      const d = distance(coord, nearest.geometry.coordinates, { units: "kilometers" });
      if (d <= maxDistanceKm) {
        hit = true;
        break;
      }
    }
    if (hit) matched.push(section);
  }
  return matched;
}

export function sectionToHighlightPolygon(
  section: SectionRow,
  bufferKm = SECTION_HIGHLIGHT_BUFFER_KM
): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (!section.geometry?.coordinates?.length) return null;
  const buffered = buffer(lineString(section.geometry.coordinates), bufferKm, {
    units: "kilometers",
  });
  if (!buffered?.geometry || buffered.geometry.type !== "Polygon") return null;
  return {
    type: "Feature",
    properties: { sectionId: section.id, slug: section.slug, name: section.name },
    geometry: buffered.geometry,
  };
}

export function sectionsToHighlightCollection(
  sections: SectionRow[],
  bufferKm = SECTION_HIGHLIGHT_BUFFER_KM
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  for (const s of sections) {
    const poly = sectionToHighlightPolygon(s, bufferKm);
    if (poly) features.push(poly);
  }
  return { type: "FeatureCollection", features };
}

export { SECTION_HIGHLIGHT_BUFFER_KM, SECTION_MATCH_DISTANCE_KM };
