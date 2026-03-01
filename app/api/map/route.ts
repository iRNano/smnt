import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getEntryExitPoisSuggested, getGpxCorridor, getGpxMainRouteGeometry, getGpxProfile } from "@/lib/loadGpxTrail";
import { mockMapData } from "@/lib/mockMapData";

function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return new Pool({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
}

let pool: Pool | null = null;
function poolOrNull(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = getPool();
  return pool;
}

export async function GET() {
  const pool = poolOrNull();
  if (!pool) {
    const gpxGeometry = getGpxMainRouteGeometry();
    // Mock data and sections commented out: only show GPX trail
    const routes =
      gpxGeometry?.coordinates?.length ?
        [
          {
            id: "gpx-trail",
            name: "Sierra Madre Nature Trail",
            route_type: "main",
            explorer_credits: [],
            opened_at: null,
            geometry: gpxGeometry,
          },
        ]
      : [];
    const trailProfile = getGpxProfile();
    const trailCorridor = getGpxCorridor();
    const entryExitPoisSuggested = getEntryExitPoisSuggested();
    return NextResponse.json({
      routes,
      pois: [],
      sections: [],
      trailProfile: trailProfile ?? null,
      trailCorridor: trailCorridor ?? null,
      entryExitPoisSuggested,
    });
  }

  let client;
  try {
    client = await pool.connect();
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

    const routes = (routesResult.rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      route_type: row.route_type,
      explorer_credits: row.explorer_credits ?? [],
      opened_at: row.opened_at,
      geometry: row.geometry,
    }));

    const pois = (poisResult.rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      poi_type: row.poi_type,
      description: row.description ?? null,
      geometry: row.geometry,
    }));

    return NextResponse.json({
      routes,
      pois,
      sections: mockMapData.sections, // DB mode still uses mock sections
    });
  } catch (err) {
    console.error("Map API error:", err);
    return NextResponse.json(
      { error: "Failed to load map data", routes: [], pois: [] },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
