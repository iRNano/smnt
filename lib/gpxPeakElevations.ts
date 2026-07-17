/**
 * Elevation lookup for real peak waypoints, keyed by exact waypoint name (as parsed by
 * lib/gpxStructure.ts). Source: NAMRIA 1:250,000 topo sheets — see docs/TOPO_REFERENCE.md.
 *
 * Deliberately empty for now: at the resolution available for review, spot-elevation
 * digits printed next to peak symbols were too small to transcribe with confidence, and a
 * wrong elevation stated as fact is worse than no elevation at all (same principle as the
 * "approximate, not authoritative" province data). Peak *names* were cross-verified against
 * the topo sheets successfully (see docs/TOPO_REFERENCE.md) — only the numeric elevations
 * were deferred. Populate this table from the finer 1:50,000-scale index sheets referenced
 * in each topo sheet's legend, or from official NAMRIA control-point data, when available.
 */
export const GPX_PEAK_ELEVATIONS_M: Record<string, number> = {};

export function getPeakElevationM(waypointName: string): number | null {
  return GPX_PEAK_ELEVATIONS_M[waypointName] ?? null;
}
