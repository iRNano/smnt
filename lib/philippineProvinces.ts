/**
 * Approximate province lookup for the SMNT corridor, for explorer-facing "which LGU do I
 * contact" context — NOT survey-grade administrative boundaries.
 *
 * These polygons are intentionally corridor-scoped: they only need to be accurate along
 * the ~8km-wide trail corridor as it crosses each province, not across each province's
 * full real extent (which would require real PSA/NAMRIA boundary data we don't have —
 * see docs/GPX_STRUCTURE.md for the broader "clean data before PostGIS" context). Treat
 * results as a starting point for outreach, not a legal/administrative determination.
 *
 * Hand-approximated from the corridor's real waypoint coordinates (lib/loadGpxTrail.ts,
 * getGpxWaypoints()) and general knowledge of where those named trailheads/peaks sit —
 * not derived from an official source. Expect boundary-area misclassification.
 */

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";

type ProvinceZone = {
  name: string;
  /** [minLng, minLat, maxLng, maxLat] rectangle — good enough at corridor scale. */
  bounds: [number, number, number, number];
};

// Checked in order; first match wins. Smaller/more specific zones are listed before the
// broader zones they're carved out of (e.g. the Gabaldon/Mingan pocket before Aurora).
const PROVINCE_ZONES: ProvinceZone[] = [
  {
    // Mt. Mingan waypoints sit inland, west of the main Aurora coastal band — Gabaldon, Nueva Ecija.
    name: "Nueva Ecija",
    bounds: [121.0, 15.35, 121.42, 15.55],
  },
  {
    name: "Quezon",
    bounds: [121.2, 14.1, 122.0, 14.95],
  },
  {
    name: "Aurora",
    bounds: [121.2, 14.85, 122.2, 15.8],
  },
  {
    // Casecnan protected landscape cluster (Peak 1080/Otundo/North Casecnan PL) — Quirino / Nueva Vizcaya interior.
    name: "Quirino / Nueva Vizcaya",
    bounds: [121.0, 15.75, 121.6, 16.45],
  },
  {
    name: "Isabela",
    bounds: [121.6, 15.75, 122.6, 17.75],
  },
  {
    name: "Cagayan",
    bounds: [121.8, 17.75, 122.6, 18.6],
  },
];

function zoneToPolygon(zone: ProvinceZone) {
  const [minLng, minLat, maxLng, maxLat] = zone.bounds;
  return polygon([
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ],
  ]);
}

/** Returns the approximate corridor-scoped province for a [lng, lat] coordinate, or null. */
export function getApproximateProvince(lng: number, lat: number): string | null {
  const pt = point([lng, lat]);
  for (const zone of PROVINCE_ZONES) {
    if (booleanPointInPolygon(pt, zoneToPolygon(zone))) return zone.name;
  }
  return null;
}
