import { getPool } from "./index.js";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,
  store       TEXT NOT NULL,
  raw_store   TEXT NOT NULL,
  category    TEXT NOT NULL,
  user_rank   INTEGER,
  cached      BOOLEAN NOT NULL DEFAULT false,
  model       TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ranked_brands (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL,
  brand    TEXT NOT NULL,
  url      TEXT NOT NULL,
  is_user  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS category_top_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  keyword     TEXT NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 1,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, keyword)
);

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queries_category  ON queries(category);
CREATE INDEX IF NOT EXISTS idx_queries_store    ON queries(store);
CREATE INDEX IF NOT EXISTS idx_queries_keyword ON queries(keyword);
CREATE INDEX IF NOT EXISTS idx_queries_created  ON queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranked_brands_qid ON ranked_brands(query_id);
CREATE INDEX IF NOT EXISTS idx_category_top_cat ON category_top_keywords(category);
`;

const SEED_SQL = `
INSERT INTO config (key, value)
VALUES ('openai_api_key', '')
ON CONFLICT (key) DO NOTHING;
`;

export async function migrate(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
  await pool.query(SEED_SQL);
  console.log(JSON.stringify({ event: "migrate_done" }));
}
