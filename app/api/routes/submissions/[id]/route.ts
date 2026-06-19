import { NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { getDbPool, tableExists } from "@/lib/db/pool";
import type { UserRouteStatus } from "@/lib/mapTypes";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { status?: UserRouteStatus; reviewer_notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { status, reviewer_notes } = body;
  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'approved' or 'rejected'." },
      { status: 400 }
    );
  }

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }

  const client = await pool.connect();
  try {
    const hasTable = await tableExists(client, "user_route_submissions");
    if (!hasTable) {
      return NextResponse.json({ error: "Schema v2 not applied." }, { status: 503 });
    }

    const result = await client.query(
      `
      UPDATE user_route_submissions
      SET status = $1,
          reviewer_notes = COALESCE($2, reviewer_notes),
          updated_at = now()
      WHERE id = $3
      RETURNING id, name, status, reviewer_notes,
                ST_AsGeoJSON(geometry)::json AS geometry,
                submitted_at
    `,
      [status, reviewer_notes ?? null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Update submission error:", err);
    return NextResponse.json({ error: "Failed to update submission." }, { status: 500 });
  } finally {
    client.release();
  }
}
