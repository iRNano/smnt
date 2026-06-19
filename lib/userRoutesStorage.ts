import type { TrailRouteRow } from "./mapTypes";

const USER_ROUTES_STORAGE_KEY = "smnt-user-routes";

export function loadLocalUserRoutes(): TrailRouteRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USER_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is TrailRouteRow =>
        !!r &&
        typeof r === "object" &&
        typeof (r as TrailRouteRow).id === "string" &&
        (r as TrailRouteRow).source === "user" &&
        (r as TrailRouteRow).geometry?.type === "LineString" &&
        Array.isArray((r as TrailRouteRow).geometry?.coordinates)
    );
  } catch {
    return [];
  }
}

export function saveLocalUserRoute(route: TrailRouteRow): void {
  const existing = loadLocalUserRoutes();
  const next = [...existing, route];
  window.localStorage.setItem(USER_ROUTES_STORAGE_KEY, JSON.stringify(next));
}

export function mergeUserRoutes(
  fromApi: TrailRouteRow[],
  fromLocal: TrailRouteRow[]
): TrailRouteRow[] {
  const apiIds = new Set(fromApi.map((r) => r.id));
  const localOnly = fromLocal.filter((r) => !apiIds.has(r.id));
  return [...fromApi, ...localOnly];
}

export { USER_ROUTES_STORAGE_KEY };
