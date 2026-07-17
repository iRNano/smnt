import type { TrailRouteRow } from "./mapTypes";
import { loadPendingSubmissions } from "./pendingSubmissionsStorage";

/** Local (no-DB) submissions, converted to map-renderable routes. Rejected submissions are omitted. */
export function loadLocalUserRoutes(): TrailRouteRow[] {
  return loadPendingSubmissions()
    .filter((s) => s.status !== "rejected")
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: "proposed_main",
      source: "user",
      status: s.status,
      explorer_credits: s.submitted_by ? [s.submitted_by] : [],
      opened_at: null,
      geometry: s.geometry,
    }));
}

export function mergeUserRoutes(
  fromApi: TrailRouteRow[],
  fromLocal: TrailRouteRow[]
): TrailRouteRow[] {
  const apiIds = new Set(fromApi.map((r) => r.id));
  const localOnly = fromLocal.filter((r) => !apiIds.has(r.id));
  return [...fromApi, ...localOnly];
}
