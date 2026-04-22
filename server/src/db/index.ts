import { Pool } from "pg";
import { getEnv } from "../lib/env.js";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const env = getEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const needsSsl = /supabase|render|neon|railway|amazonaws|sslmode=require/i.test(env.DATABASE_URL);
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });
  pool.on("error", (err) => {
    console.error(JSON.stringify({ event: "pg_pool_error", error: err.message }));
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
