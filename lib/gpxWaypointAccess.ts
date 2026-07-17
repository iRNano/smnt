/**
 * Access-context notes for real trailhead/exit waypoints, keyed by exact waypoint name (as
 * parsed by lib/gpxStructure.ts). Source: NAMRIA 1:250,000 topo sheets — see
 * docs/TOPO_REFERENCE.md for the sheet-by-sheet method and what's still unsourced.
 *
 * Only populated where a municipality/road connection was directly and clearly legible on
 * the topo sheet — most of the 22 trailhead/exit waypoints are NOT yet covered. An explorer
 * reading "no access info yet" should trust that over a guessed route.
 */
export const GPX_WAYPOINT_ACCESS_NOTES: Record<string, string> = {
  "Mauban Trailhead":
    "Near the town of Mauban, Quezon — connected by all-weather road to the Quezon/Laguna road network (NAMRIA sheet 2512 Daet).",
  "Umiray Trailhead":
    "Near Umiray (Molawin), on the Quezon/Aurora boundary — coastal road access from Dingalan, Aurora (NAMRIA sheet 2510 Laur).",
  "Mingan Trailhead":
    "Near Mount Mingan, close to the Nueva Ecija/Aurora boundary — road network reaches this area via Gabaldon/Bongabon, Nueva Ecija (NAMRIA sheet 2510 Laur).",
};

export function getWaypointAccessNote(waypointName: string): string | null {
  return GPX_WAYPOINT_ACCESS_NOTES[waypointName] ?? null;
}
