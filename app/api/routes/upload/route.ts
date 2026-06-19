import { NextResponse } from "next/server";
import { getDbPool, tableExists } from "@/lib/db/pool";
import { parseGpxXmlToLineString } from "@/lib/parseGpxToLineString";

const MAX_GPX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Route upload requires DATABASE_URL and schema v2 (user_route_submissions)." },
      { status: 503 }
    );
  }

  const client = await pool.connect();
  try {
    const hasTable = await tableExists(client, "user_route_submissions");
    if (!hasTable) {
      return NextResponse.json(
        { error: "Run scripts/schema-v2.sql to enable route uploads." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("gpx");
    const nameInput = formData.get("name");
    const routeName =
      typeof nameInput === "string" && nameInput.trim() ? nameInput.trim() : "User route";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing GPX file (field: gpx)." }, { status: 400 });
    }

    if (file.size > MAX_GPX_BYTES) {
      return NextResponse.json({ error: "GPX file too large (max 5 MB)." }, { status: 400 });
    }

    const xml = await file.text();
    const geometry = parseGpxXmlToLineString(xml);
    if (!geometry || geometry.coordinates.length < 2) {
      return NextResponse.json(
        { error: "Could not parse a valid track from the GPX file." },
        { status: 400 }
      );
    }

    const result = await client.query(
      `
      INSERT INTO user_route_submissions (name, geometry, status, source_format)
      VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), 'pending', 'gpx')
      RETURNING id, name, status, ST_AsGeoJSON(geometry)::json AS geometry, submitted_at
    `,
      [routeName, JSON.stringify(geometry)]
    );

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      status: row.status,
      geometry: row.geometry,
      submitted_at: row.submitted_at,
    });
  } catch (err) {
    console.error("Route upload error:", err);
    return NextResponse.json({ error: "Failed to save route." }, { status: 500 });
  } finally {
    client.release();
  }
}
