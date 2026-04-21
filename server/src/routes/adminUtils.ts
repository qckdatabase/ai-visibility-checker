import { getEnv } from "../lib/env.js";
import type { Pool } from "pg";

let _pool: Pool | null = null;

function getPoolUnsafe(): Pool {
  if (_pool) return _pool;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require("pg");
  _pool = new Pool({ connectionString: getEnv().DATABASE_URL });
  return _pool;
}

export function tryPool(): Pool | null {
  try {
    return getPoolUnsafe();
  } catch {
    return null;
  }
}
