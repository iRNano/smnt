import type {
  LegacyRouteRow,
  MapApiResponse,
  PoiRow,
  RouteCategory,
  SectionRow,
  TrailProfile,
  TrailRouteRow,
  UserRouteStatus,
} from "./mapTypes";

export const LAYER_COLORS = {
  proposedMain: "#6B7280",
  exit: "#EA580C",
  notPassable: "#991B1B",
  userRoute: "#7C3AED",
  sectionHighlight: "#F59E0B",
} as const;

export function categoryToLegacyRouteType(category: RouteCategory): string {
  if (category === "proposed_main" || category === "verified_main") return "main";
  return category;
}

export function trailRouteToLegacy(row: TrailRouteRow): LegacyRouteRow {
  return {
    id: row.id,
    name: row.name,
    route_type: categoryToLegacyRouteType(row.category),
    explorer_credits: row.explorer_credits,
    opened_at: row.opened_at,
    geometry: row.geometry,
  };
}

export function legacyRouteToTrailRoute(row: LegacyRouteRow): TrailRouteRow {
  const category: RouteCategory =
    row.route_type === "exit" ? "exit"
    : row.route_type === "not_passable" ? "not_passable"
    : "proposed_main";
  return {
    id: row.id,
    name: row.name,
    category,
    source: "official",
    explorer_credits: row.explorer_credits ?? [],
    opened_at: row.opened_at,
    geometry: row.geometry,
  };
}

export function splitLegacyRoutes(routes: LegacyRouteRow[]): {
  proposedMain: TrailRouteRow | null;
  officialRoutes: TrailRouteRow[];
} {
  const trail = routes.map(legacyRouteToTrailRoute);
  const proposedMain = trail.find((r) => r.category === "proposed_main" || r.category === "verified_main") ?? null;
  const officialRoutes = trail.filter(
    (r) => r.category === "exit" || r.category === "not_passable"
  );
  return { proposedMain, officialRoutes };
}

export function buildLegacyRoutes(
  proposedMain: TrailRouteRow | null,
  officialRoutes: TrailRouteRow[],
  userRoutes: TrailRouteRow[]
): LegacyRouteRow[] {
  const official = [
    ...(proposedMain ? [trailRouteToLegacy(proposedMain)] : []),
    ...officialRoutes.map(trailRouteToLegacy),
  ];
  const user = userRoutes.map((r) => ({
    ...trailRouteToLegacy(r),
    route_type: "user",
  }));
  return [...official, ...user];
}

export function buildMapApiResponse(parts: {
  proposedMain: TrailRouteRow | null;
  officialRoutes: TrailRouteRow[];
  userRoutes: TrailRouteRow[];
  pois: PoiRow[];
  sections: SectionRow[];
  trailProfile: TrailProfile;
  trailCorridor: GeoJSON.Feature<GeoJSON.Polygon> | null;
  entryExitPoisSuggested: PoiRow[];
}): MapApiResponse {
  return {
    proposedMain: parts.proposedMain,
    officialRoutes: parts.officialRoutes,
    userRoutes: parts.userRoutes,
    routes: buildLegacyRoutes(parts.proposedMain, parts.officialRoutes, parts.userRoutes),
    pois: parts.pois,
    sections: parts.sections,
    trailProfile: parts.trailProfile,
    trailCorridor: parts.trailCorridor,
    entryExitPoisSuggested: parts.entryExitPoisSuggested,
  };
}

export function trailRouteFromDbRow(row: {
  id: string;
  name: string;
  category: string;
  verification_status?: string | null;
  explorer_credits?: string[] | null;
  opened_at?: string | null;
  geometry: GeoJSON.LineString;
}): TrailRouteRow {
  return {
    id: row.id,
    name: row.name,
    category: row.category as RouteCategory,
    source: "official",
    explorer_credits: row.explorer_credits ?? [],
    opened_at: row.opened_at ?? null,
    geometry: row.geometry,
  };
}

export function userRouteFromDbRow(row: {
  id: string;
  name: string;
  status: string;
  geometry: GeoJSON.LineString;
  submitted_by?: string | null;
}): TrailRouteRow {
  return {
    id: row.id,
    name: row.name,
    category: "proposed_main",
    source: "user",
    status: row.status as UserRouteStatus,
    explorer_credits: row.submitted_by ? [row.submitted_by] : [],
    opened_at: null,
    geometry: row.geometry,
  };
}

export function proposedMainFromGeometry(
  id: string,
  name: string,
  geometry: GeoJSON.LineString
): TrailRouteRow {
  return {
    id,
    name,
    category: "proposed_main",
    source: "official",
    explorer_credits: [],
    opened_at: null,
    geometry,
  };
}
