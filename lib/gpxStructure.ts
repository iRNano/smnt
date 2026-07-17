/**
 * Shared GPX structure analyzer — used by scripts/gpx-lint.mjs (CLI) and, going forward,
 * the submit-route confirmation step described in docs/GPX_STRUCTURE.md §4.
 *
 * Deliberately a reporter, not an auto-fixer: GPX structure implies real-world claims
 * (this point is the trailhead, this one is a water source) that only a human contributor
 * can confirm. See docs/GPX_STRUCTURE.md for the full rationale and naming conventions.
 */

import { gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";

export type WaypointRole =
  | "start"
  | "exit"
  | "camp"
  | "water"
  | "peak"
  | "poi"
  | "danger"
  | "other";

export type GpxWaypoint = {
  name: string;
  role: WaypointRole;
  /** Whether the role came from the file's own tagging (name prefix / sym) or is unclassified. */
  classified: boolean;
  coordinates: [number, number];
};

export type GpxTrack = {
  name: string | null;
  pointCount: number;
  hasElevation: boolean;
  elevationCoveragePct: number;
  coordinates: [number, number][];
};

export type GpxAnalysis = {
  tracks: GpxTrack[];
  waypoints: GpxWaypoint[];
  /** True when no waypoints were found and start/exit were inferred from track endpoints instead. */
  inferredEndpoints: boolean;
  warnings: string[];
};

const NAME_PREFIX_ROLES: { prefix: string; role: WaypointRole }[] = [
  { prefix: "start:", role: "start" },
  { prefix: "th:", role: "start" },
  { prefix: "end:", role: "exit" },
  { prefix: "exit:", role: "exit" },
  { prefix: "camp:", role: "camp" },
  { prefix: "water:", role: "water" },
  { prefix: "danger:", role: "danger" },
  { prefix: "poi:", role: "poi" },
];

const SYM_ROLES: Record<string, WaypointRole> = {
  trailhead: "start",
  "parking area": "start",
  summit: "peak",
  "water source": "water",
  campsite: "camp",
  "danger area": "danger",
};

/**
 * Substring-based fallback for real-world naming conventions we don't control
 * (e.g. "Mauban Trailhead", "Mingan Summit", "North NSMNP Exit Trailhead" — the
 * actual style found in lib/data/The-Sierra-Madre-Nature-Trail.gpx). Checked
 * after the explicit prefix convention. "exit" takes priority over "trailhead"
 * since a name can legitimately contain both (a trailhead that also exits the park).
 */
const NAME_SUBSTRING_ROLES: { pattern: RegExp; role: WaypointRole }[] = [
  { pattern: /exit/i, role: "exit" },
  { pattern: /trail\s*head/i, role: "start" },
  { pattern: /summit|peak/i, role: "peak" },
  { pattern: /camp(site)?/i, role: "camp" },
  { pattern: /water|spring/i, role: "water" },
  { pattern: /danger|hazard/i, role: "danger" },
];

function classifyWaypointName(name: string): { role: WaypointRole; classified: boolean } {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const { prefix, role } of NAME_PREFIX_ROLES) {
    if (lower.startsWith(prefix)) return { role, classified: true };
  }
  for (const { pattern, role } of NAME_SUBSTRING_ROLES) {
    if (pattern.test(trimmed)) return { role, classified: true };
  }
  return { role: "other", classified: false };
}

function classifyWaypointSym(sym: string | undefined): WaypointRole | null {
  if (!sym) return null;
  return SYM_ROLES[sym.trim().toLowerCase()] ?? null;
}

function stripKnownPrefix(name: string): string {
  const lower = name.trim().toLowerCase();
  for (const { prefix } of NAME_PREFIX_ROLES) {
    if (lower.startsWith(prefix)) return name.trim().slice(prefix.length).trim();
  }
  return name.trim();
}

/** Elevation is only checked via the raw XML since togeojson doesn't surface per-point <ele> on LineStrings. */
function trackElevationCoverage(doc: Document, gpxNs: string): { hasAny: boolean; pct: number } {
  const trkpts = doc.getElementsByTagNameNS(gpxNs, "trkpt");
  if (trkpts.length === 0) return { hasAny: false, pct: 0 };
  let withEle = 0;
  for (let i = 0; i < trkpts.length; i++) {
    const ele = trkpts[i]!.getElementsByTagNameNS(gpxNs, "ele")[0];
    if (ele?.textContent && !Number.isNaN(parseFloat(ele.textContent))) withEle++;
  }
  return { hasAny: withEle > 0, pct: Math.round((withEle / trkpts.length) * 100) };
}

export function analyzeGpx(xml: string): GpxAnalysis {
  const warnings: string[] = [];
  const doc = new DOMParser().parseFromString(xml, "text/xml") as unknown as Document;
  const GPX_NS = "http://www.topografix.com/GPX/1/1";
  const fc = gpx(doc as never);

  const lineFeatures = fc.features.filter(
    (f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString"
  );
  const pointFeatures = fc.features.filter((f) => f.geometry?.type === "Point");

  const { pct: overallElevationPct, hasAny: hasAnyElevation } = trackElevationCoverage(
    doc,
    GPX_NS
  );

  const tracks: GpxTrack[] = lineFeatures.map((f) => {
    const coords: [number, number][] = [];
    const geom = f.geometry;
    if (geom.type === "LineString") {
      for (const c of geom.coordinates) coords.push([Number(c[0]), Number(c[1])]);
    } else if (geom.type === "MultiLineString") {
      for (const line of geom.coordinates) {
        for (const c of line) coords.push([Number(c[0]), Number(c[1])]);
      }
    }
    return {
      name: (f.properties as { name?: string } | null)?.name ?? null,
      pointCount: coords.length,
      hasElevation: hasAnyElevation,
      elevationCoveragePct: overallElevationPct,
      coordinates: coords,
    };
  });

  if (tracks.length === 0) {
    warnings.push("No track (<trk>) found — nothing to submit.");
  } else if (tracks.length > 1) {
    warnings.push(
      `File contains ${tracks.length} separate tracks. These will be treated as distinct candidate sections, not merged into one line — verify that's what you intend.`
    );
  }

  for (const t of tracks) {
    if (t.pointCount < 2) {
      warnings.push(`Track "${t.name ?? "(unnamed)"}" has fewer than 2 points and will be rejected.`);
    }
  }

  if (!hasAnyElevation) {
    warnings.push(
      "No elevation (<ele>) data found on any trackpoint — this submission won't have its own elevation profile."
    );
  } else if (overallElevationPct < 100) {
    warnings.push(
      `Only ${overallElevationPct}% of trackpoints have elevation data — the elevation profile may have gaps.`
    );
  }

  const waypoints: GpxWaypoint[] = pointFeatures.map((f) => {
    const props = (f.properties ?? {}) as { name?: string; sym?: string };
    const rawName = props.name ?? "Waypoint";
    const symRole = classifyWaypointSym(props.sym);
    const { role: nameRole, classified: nameClassified } = classifyWaypointName(rawName);
    const role = symRole ?? nameRole;
    const classified = symRole !== null || nameClassified;
    const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
    return {
      name: stripKnownPrefix(rawName),
      role,
      classified,
      coordinates: coords,
    };
  });

  let inferredEndpoints = false;
  if (waypoints.length === 0 && tracks.length > 0 && tracks[0]!.coordinates.length >= 2) {
    inferredEndpoints = true;
    warnings.push(
      "No waypoints (<wpt>) found — start/exit points will be suggested from track endpoints only. Confirm these manually before they're stored."
    );
  } else if (waypoints.length > 0) {
    const hasStart = waypoints.some((w) => w.role === "start");
    const hasExit = waypoints.some((w) => w.role === "exit");
    if (!hasStart) warnings.push("No waypoint classified as a start/trailhead point.");
    if (!hasExit) warnings.push("No waypoint classified as an exit point.");
    const unclassified = waypoints.filter((w) => !w.classified).length;
    if (unclassified > 0) {
      warnings.push(
        `${unclassified} waypoint(s) could not be classified by name/sym and will be treated as generic POIs — see docs/GPX_STRUCTURE.md §2.2 for the naming convention.`
      );
    }
  }

  return { tracks, waypoints, inferredEndpoints, warnings };
}
