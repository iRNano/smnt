import type { UserRouteStatus } from "./mapTypes";

export type RouteSubmission = {
  id: string;
  name: string;
  status: UserRouteStatus;
  geometry: GeoJSON.LineString;
  submitted_at: string;
  reviewer_notes?: string | null;
  submitted_by?: string | null;
};
