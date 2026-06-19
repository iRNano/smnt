import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function tableExists(client: { query: Pool["query"] }, tableName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName]
  );
  return Boolean(result.rows[0]?.exists);
}
