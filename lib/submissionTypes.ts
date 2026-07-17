import type { UserRouteStatus } from "./mapTypes";
import type { WaypointRole } from "./gpxStructure";

export type ConfirmedPoi = {
  name: string;
  poi_type: WaypointRole;
  geometry: GeoJSON.Point;
  source: "contributor" | "inferred";
};

export type RouteSubmission = {
  id: string;
  name: string;
  status: UserRouteStatus;
  geometry: GeoJSON.LineString;
  submitted_at: string;
  reviewer_notes?: string | null;
  submitted_by?: string | null;
  pois?: ConfirmedPoi[];
};
