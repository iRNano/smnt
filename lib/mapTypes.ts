/**
 * Shared map API types (structured v2 + legacy compatibility).
 */

export type RouteCategory = "proposed_main" | "exit" | "not_passable" | "verified_main";
export type RouteSource = "official" | "user";
export type UserRouteStatus = "pending" | "approved" | "rejected";

export type TrailRouteRow = {
  id: string;
  name: string;
  category: RouteCategory;
  source: RouteSource;
  status?: UserRouteStatus;
  explorer_credits: string[];
  opened_at: string | null;
  geometry: GeoJSON.LineString;
};

/** @deprecated Use TrailRouteRow + structured fields; kept for backward compatibility */
export type LegacyRouteRow = {
  id: string;
  name: string;
  route_type: string;
  explorer_credits: string[];
  opened_at: string | null;
  geometry: GeoJSON.LineString;
};

export type PoiRow = {
  id: string;
  name: string;
  poi_type: string;
  description: string | null;
  geometry: GeoJSON.Point;
  /** Approximate corridor-scoped province — see lib/philippineProvinces.ts. Not authoritative. */
  province?: string | null;
};

export type SectionRow = {
  id: string;
  slug: string;
  name: string;
  from_poi: string;
  to_poi: string;
  description: string | null;
  geometry: GeoJSON.LineString;
  /** Approximate corridor-scoped province(s) this section passes through. Not authoritative. */
  provinces?: string[];
  /** Names of peak-role waypoints whose chainage falls within this section. */
  peaksInSection?: string[];
};

export type TrailProfile = { distances: number[]; elevations: number[] } | null;

export type MapApiResponse = {
  proposedMain: TrailRouteRow | null;
  officialRoutes: TrailRouteRow[];
  userRoutes: TrailRouteRow[];
  /** Flat list for legacy clients; derived from structured fields */
  routes: LegacyRouteRow[];
  pois: PoiRow[];
  sections: SectionRow[];
  trailProfile: TrailProfile;
  trailCorridor: GeoJSON.Feature<GeoJSON.Polygon> | null;
  entryExitPoisSuggested: PoiRow[];
};

export type MapData = MapApiResponse;
