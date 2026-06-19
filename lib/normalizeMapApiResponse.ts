import { buildMapApiResponse, splitLegacyRoutes } from "@/lib/mapApiBuilder";
import type { LegacyRouteRow, MapApiResponse, PoiRow, SectionRow } from "@/lib/mapTypes";

/** Normalize API JSON (supports legacy responses missing structured fields). Client-safe. */
export function normalizeMapApiResponse(json: Record<string, unknown>): MapApiResponse {
  if (json.proposedMain !== undefined || json.officialRoutes !== undefined) {
    return json as unknown as MapApiResponse;
  }

  const legacyRoutes = (json.routes ?? []) as LegacyRouteRow[];
  const { proposedMain, officialRoutes } = splitLegacyRoutes(legacyRoutes);

  return buildMapApiResponse({
    proposedMain,
    officialRoutes,
    userRoutes: (json.userRoutes ?? []) as MapApiResponse["userRoutes"],
    pois: (json.pois ?? []) as PoiRow[],
    sections: (json.sections ?? []) as SectionRow[],
    trailProfile: (json.trailProfile as MapApiResponse["trailProfile"]) ?? null,
    trailCorridor: (json.trailCorridor as MapApiResponse["trailCorridor"]) ?? null,
    entryExitPoisSuggested: (json.entryExitPoisSuggested ?? []) as PoiRow[],
  });
}
