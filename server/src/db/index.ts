import { Pool } from "pg";
import { getEnv } from "../lib/env.js";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const env = getEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  pool = new Pool({ connectionString: env.DATABASE_URL });
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
