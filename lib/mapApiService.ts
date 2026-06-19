import type { PoolClient } from "pg";
import {
  buildMapApiResponse,
  proposedMainFromGeometry,
  splitLegacyRoutes,
  trailRouteFromDbRow,
  userRouteFromDbRow,
} from "@/lib/mapApiBuilder";
import { getDbPool, tableExists } from "@/lib/db/pool";
import {
  getEntryExitPoisSuggested,
  getGpxCorridor,
  getGpxMainRouteGeometry,
  getGpxProfile,
} from "@/lib/loadGpxTrail";
import { mockMapData } from "@/lib/mockMapData";
import { deriveTrailSections } from "@/lib/sectionUtils";
import type { LegacyRouteRow, MapApiResponse, PoiRow, SectionRow, TrailRouteRow } from "@/lib/mapTypes";

async function loadFromTrailRoutesV2(client: PoolClient): Promise<{
  proposedMain: TrailRouteRow | null;
  officialRoutes: TrailRouteRow[];
  userRoutes: TrailRouteRow[];
  pois: PoiRow[];
  sections: SectionRow[];
} | null> {
  const hasV2 = await tableExists(client, "trail_routes");
  if (!hasV2) return null;

  const hasSections = await tableExists(client, "trail_sections");

  const [trailResult, userResult, poisResult, sectionsResult] = await Promise.all([
    client.query(`
      SELECT id, name, category, verification_status, explorer_credits, opened_at,
             ST_AsGeoJSON(geometry)::json AS geometry
      FROM trail_routes
      ORDER BY category, name
    `),
    client.query(`
      SELECT id, name, status,
             ST_AsGeoJSON(geometry)::json AS geometry
      FROM user_route_submissions
      WHERE status = 'approved'
      ORDER BY submitted_at DESC
    `),
    client.query(`
      SELECT id, name, poi_type, description,
             ST_AsGeoJSON(geometry)::json AS geometry
      FROM pois
      ORDER BY name
    `),
    hasSections
      ? client.query(`
          SELECT id, slug, name, from_poi, to_poi, description,
                 ST_AsGeoJSON(geometry)::json AS geometry
          FROM trail_sections
          ORDER BY sort_order, name
        `)
      : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
  ]);

  const trailRows = (trailResult.rows || []).map(trailRouteFromDbRow);
  const proposedMain =
    trailRows.find((r) => r.category === "proposed_main" || r.category === "verified_main") ?? null;
  const officialRoutes = trailRows.filter(
    (r) => r.category === "exit" || r.category === "not_passable"
  );
  const userRoutes = (userResult.rows || []).map(userRouteFromDbRow);

  const pois = (poisResult.rows || []).map((row) => ({
    id: row.id,
    name: row.name,
    poi_type: row.poi_type,
    description: row.description ?? null,
    geometry: row.geometry,
  }));

  const sections: SectionRow[] = (sectionsResult.rows || []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    from_poi: row.from_poi as string,
    to_poi: row.to_poi as string,
    description: (row.description as string | null) ?? null,
    geometry: row.geometry as GeoJSON.LineString,
  }));

  return {
    proposedMain,
    officialRoutes,
    userRoutes,
    pois,
    sections: sections.length > 0 ? sections : mockMapData.sections,
  };
}

async function loadFromLegacyRoutes(client: PoolClient): Promise<{
  proposedMain: TrailRouteRow | null;
  officialRoutes: TrailRouteRow[];
  userRoutes: TrailRouteRow[];
  pois: PoiRow[];
  sections: SectionRow[];
}> {
  const [routesResult, poisResult] = await Promise.all([
    client.query(`
      SELECT id, name, route_type, explorer_credits, opened_at,
             ST_AsGeoJSON(geometry)::json AS geometry
      FROM routes
      ORDER BY route_type, name
    `),
    client.query(`
      SELECT id, name, poi_type, description,
             ST_AsGeoJSON(geometry)::json AS geometry
      FROM pois
      ORDER BY name
    `),
  ]);

  const legacyRoutes: LegacyRouteRow[] = (routesResult.rows || []).map((row) => ({
    id: row.id,
    name: row.name,
    route_type: row.route_type,
    explorer_credits: row.explorer_credits ?? [],
    opened_at: row.opened_at,
    geometry: row.geometry,
  }));

  const { proposedMain, officialRoutes } = splitLegacyRoutes(legacyRoutes);

  const pois = (poisResult.rows || []).map((row) => ({
    id: row.id,
    name: row.name,
    poi_type: row.poi_type,
    description: row.description ?? null,
    geometry: row.geometry,
  }));

  return {
    proposedMain,
    officialRoutes,
    userRoutes: [],
    pois,
    sections: mockMapData.sections,
  };
}

export async function getMapApiResponse(): Promise<MapApiResponse> {
  const pool = getDbPool();

  if (!pool) {
    const gpxGeometry = getGpxMainRouteGeometry();
    const proposedMain =
      gpxGeometry?.coordinates?.length
        ? proposedMainFromGeometry("gpx-trail", "Sierra Madre Nature Trail", gpxGeometry)
        : null;
    const entryExitPoisSuggested = getEntryExitPoisSuggested();
    const sections = gpxGeometry
      ? deriveTrailSections(gpxGeometry, entryExitPoisSuggested)
      : [];

    return buildMapApiResponse({
      proposedMain,
      officialRoutes: [],
      userRoutes: [],
      pois: [],
      sections,
      trailProfile: getGpxProfile(),
      trailCorridor: getGpxCorridor(),
      entryExitPoisSuggested,
    });
  }

  const client = await pool.connect();
  try {
    const v2 = await loadFromTrailRoutesV2(client);
    const data = v2 ?? (await loadFromLegacyRoutes(client));

    return buildMapApiResponse({
      ...data,
      trailProfile: null,
      trailCorridor: null,
      entryExitPoisSuggested: [],
    });
  } finally {
    client.release();
  }
}
