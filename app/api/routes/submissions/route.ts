import { NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/adminAuth";
import { getDbPool, tableExists } from "@/lib/db/pool";

export async function GET(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured. Use local pending queue in admin UI." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const client = await pool.connect();
  try {
    const hasTable = await tableExists(client, "user_route_submissions");
    if (!hasTable) {
      return NextResponse.json(
        { error: "Run scripts/schema-v2.sql to enable route submissions." },
        { status: 503 }
      );
    }

    const params: string[] = [];
    let where = "";
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      where = "WHERE status = $1";
      params.push(statusFilter);
    }

    const result = await client.query(
      `
      SELECT id, name, status, reviewer_notes, submitted_by,
             ST_AsGeoJSON(geometry)::json AS geometry,
             submitted_at
      FROM user_route_submissions
      ${where}
      ORDER BY submitted_at DESC
    `,
      params
    );

    return NextResponse.json({ submissions: result.rows });
  } catch (err) {
    console.error("List submissions error:", err);
    return NextResponse.json({ error: "Failed to list submissions." }, { status: 500 });
  } finally {
    client.release();
  }
}
