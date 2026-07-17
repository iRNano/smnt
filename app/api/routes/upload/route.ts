import { NextResponse } from "next/server";
import { getDbPool, tableExists } from "@/lib/db/pool";
import { parseGpxXmlToLineString } from "@/lib/parseGpxToLineString";
import type { ConfirmedPoi } from "@/lib/submissionTypes";

const MAX_GPX_BYTES = 5 * 1024 * 1024;
const VALID_POI_TYPES = new Set([
  "start",
  "exit",
  "camp",
  "water",
  "summit",
  "poi",
  "danger",
  "other",
]);

function parseConfirmedPois(input: FormDataEntryValue | null): ConfirmedPoi[] {
  if (typeof input !== "string") return [];
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is ConfirmedPoi =>
        !!p &&
        typeof p === "object" &&
        typeof (p as ConfirmedPoi).name === "string" &&
        VALID_POI_TYPES.has((p as ConfirmedPoi).poi_type) &&
        (p as ConfirmedPoi).geometry?.type === "Point" &&
        Array.isArray((p as ConfirmedPoi).geometry?.coordinates)
    );
  } catch {
    return [];
  }
}

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
    const submittedByInput = formData.get("submitted_by");
    const submittedBy =
      typeof submittedByInput === "string" && submittedByInput.trim()
        ? submittedByInput.trim()
        : null;
    const confirmedPois = parseConfirmedPois(formData.get("pois"));

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
      INSERT INTO user_route_submissions (name, geometry, status, source_format, submitted_by)
      VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), 'pending', 'gpx', $3)
      RETURNING id, name, status, ST_AsGeoJSON(geometry)::json AS geometry, submitted_at, submitted_by
    `,
      [routeName, JSON.stringify(geometry), submittedBy]
    );

    const row = result.rows[0];

    if (confirmedPois.length > 0 && (await tableExists(client, "submission_pois"))) {
      for (const poi of confirmedPois) {
        await client.query(
          `
          INSERT INTO submission_pois (submission_id, name, poi_type, geometry, source)
          VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5)
        `,
          [row.id, poi.name, poi.poi_type, JSON.stringify(poi.geometry), poi.source]
        );
      }
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      status: row.status,
      geometry: row.geometry,
      submitted_at: row.submitted_at,
      submitted_by: row.submitted_by,
    });
  } catch (err) {
    console.error("Route upload error:", err);
    return NextResponse.json({ error: "Failed to save route." }, { status: 500 });
  } finally {
    client.release();
  }
}
