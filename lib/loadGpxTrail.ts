/**
 * Server-only: load the SMNT GPX file and return the main track, elevation profile, and corridor.
 * Used by the map API in mock mode; the GPX file is never exposed to the client.
 */

import { gpx } from "@tmcw/togeojson";
import along from "@turf/along";
import distance from "@turf/distance";
import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";
import fs from "fs";
import path from "path";
import { DOMParser } from "@xmldom/xmldom";

const GPX_PATH = path.join(process.cwd(), "lib", "data", "The-Sierra-Madre-Nature-Trail.gpx");
const GPX_NS = "http://www.topografix.com/GPX/1/1";
const CORRIDOR_BUFFER_KM = 8;
const BASE_ELEVATION_THRESHOLD_M = 80;
const MIN_SPACING_KM = 2;

export type EntryExitPoiRow = {
  id: string;
  name: string;
  poi_type: string;
  description: string | null;
  geometry: GeoJSON.Point;
};

let cached: GeoJSON.LineString | null | undefined = undefined;
let profileCache: { distances: number[]; elevations: number[] } | null | undefined = undefined;
let corridorCache: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined = undefined;
let entryExitSuggestedCache: EntryExitPoiRow[] | undefined = undefined;

/**
 * Returns the main track from the GPX file as a single LineString, or null if missing/failed.
 * Result is cached in memory.
 */
export function getGpxMainRouteGeometry(): GeoJSON.LineString | null {
  if (cached !== undefined) return cached;

  try {
    const xml = fs.readFileSync(GPX_PATH, "utf-8");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const fc = gpx(doc);
    if (!fc?.features?.length) {
      cached = null;
      return null;
    }

    const coords: [number, number][] = [];
    for (const f of fc.features) {
      const geom = f.geometry;
      if (geom?.type === "LineString" && Array.isArray(geom.coordinates)) {
        for (const c of geom.coordinates) {
          if (Array.isArray(c) && c.length >= 2) coords.push([Number(c[0]), Number(c[1])]);
        }
      }
    }
    if (coords.length === 0) {
      cached = null;
      return null;
    }

    cached = { type: "LineString", coordinates: coords };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/**
 * Returns elevation profile: cumulative distance (km) and elevation (m) per point.
 * Cached in memory.
 */
export function getGpxProfile(): { distances: number[]; elevations: number[] } | null {
  if (profileCache !== undefined) return profileCache;

  try {
    const xml = fs.readFileSync(GPX_PATH, "utf-8");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const trkpts = doc.getElementsByTagNameNS(GPX_NS, "trkpt");
    if (!trkpts.length) {
      profileCache = null;
      return null;
    }

    const distances: number[] = [];
    const elevations: number[] = [];

    let prev: [number, number] | null = null;
    for (let i = 0; i < trkpts.length; i++) {
      const pt = trkpts[i]!;
      const lat = parseFloat(pt.getAttribute("lat") ?? "");
      const lon = parseFloat(pt.getAttribute("lon") ?? "");
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

      const eleEl = pt.getElementsByTagNameNS(GPX_NS, "ele")[0];
      const ele = eleEl ? parseFloat(eleEl.textContent ?? "") : NaN;
      elevations.push(Number.isNaN(ele) ? 0 : ele);

      const here: [number, number] = [lon, lat];
      if (prev === null) {
        distances.push(0);
      } else {
        const km = distance(prev, here, { units: "kilometers" });
        distances.push(distances[distances.length - 1]! + km);
      }
      prev = here;
    }

    if (distances.length === 0 || distances.length !== elevations.length) {
      profileCache = null;
      return null;
    }
    profileCache = { distances, elevations };
    return profileCache;
  } catch {
    profileCache = null;
    return null;
  }
}

/**
 * Returns a corridor polygon (buffer around the full GPX track). Cached in memory.
 */
export function getGpxCorridor(): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (corridorCache !== undefined) return corridorCache;

  const line = getGpxMainRouteGeometry();
  if (!line?.coordinates?.length) {
    corridorCache = null;
    return null;
  }

  try {
    const lineFeature = lineString(line.coordinates);
    const buffered = buffer(lineFeature, CORRIDOR_BUFFER_KM, { units: "kilometers" });
    const geom = buffered?.geometry;
    if (!geom || geom.type !== "Polygon") {
      corridorCache = null;
      return null;
    }
    corridorCache = { type: "Feature", properties: {}, geometry: geom };
    return corridorCache;
  } catch {
    corridorCache = null;
    return null;
  }
}

/**
 * Auto-suggested entry/exit POIs where elevation is at or near base (start elevation).
 * Cached in memory.
 */
export function getEntryExitPoisSuggested(): EntryExitPoiRow[] {
  if (entryExitSuggestedCache !== undefined) return entryExitSuggestedCache;

  const profile = getGpxProfile();
  const line = getGpxMainRouteGeometry();
  if (!profile?.distances?.length || !line?.coordinates?.length) {
    const empty: EntryExitPoiRow[] = [];
    entryExitSuggestedCache = empty;
    return empty;
  }

  const { distances, elevations } = profile;
  const n = distances.length;
  const baseElevation = elevations[0]!;
  const threshold = BASE_ELEVATION_THRESHOLD_M;
  const lineFeature = lineString(line.coordinates);

  const distancesToAdd: number[] = [];

  // Start: always add
  distancesToAdd.push(0);

  // End: add if near base
  if (n > 1 && Math.abs(elevations[n - 1]! - baseElevation) <= threshold) {
    distancesToAdd.push(distances[n - 1]!);
  }

  // Intermediate: return-to-base with min spacing
  let lastAddedDistance = 0;
  let seenAboveBase = false;
  for (let i = 1; i < n - 1; i++) {
    const d = distances[i]!;
    const e = elevations[i]!;
    if (e > baseElevation + threshold) seenAboveBase = true;
    const nearBase = Math.abs(e - baseElevation) <= threshold;
    if (nearBase && seenAboveBase && d - lastAddedDistance >= MIN_SPACING_KM) {
      distancesToAdd.push(d);
      lastAddedDistance = d;
    }
  }

  // Sort and dedupe by distance (keep order: start, intermediates, end)
  const unique = [...new Set(distancesToAdd)].sort((a, b) => a - b);

  const pois: EntryExitPoiRow[] = unique.map((distKm, idx) => {
    const pt = along(lineFeature, distKm, { units: "kilometers" });
    const [lng, lat] = pt.geometry.coordinates;
    return {
      id: `entry-exit-suggested-${idx}`,
      name: "Entry/exit point",
      poi_type: "entry_exit",
      description: null,
      geometry: { type: "Point", coordinates: [lng, lat] },
    };
  });

  entryExitSuggestedCache = pois;
  return pois;
}
