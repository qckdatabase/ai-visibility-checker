import type { QueryStore, VisibilityRecord } from "../store/types.js";
import type { VisibilityResponse } from "../types.js";
import { getPool } from "./index.js";

export function createPgStore(): QueryStore {
  return {
    async get(keyword: string, store: string): Promise<VisibilityRecord | null> {
      const pool = getPool();
      const q = await pool.query<{
        id: string;
        keyword: string;
        store: string;
        raw_store: string;
        category: string;
        user_rank: number | null;
        cached: boolean;
        model: string;
        created_at: Date;
      }>(
        `SELECT id, keyword, store, raw_store, category, user_rank, cached, model, created_at
         FROM queries
         WHERE keyword = $1 AND store = $2
         LIMIT 1`,
        [keyword, store],
      );
      if (q.rowCount === 0) return null;

      const row = q.rows[0];
      const brands = await pool.query<{ rank: number; brand: string; url: string; reason: string; is_user: boolean }>(
        `SELECT rank, brand, url, reason, is_user FROM ranked_brands WHERE query_id = $1 ORDER BY rank`,
        [row.id],
      );

      const result: VisibilityResponse = {
        results: brands.rows.map((b) => ({
          rank: b.rank,
          brand: b.brand,
          url: b.url,
          reason: b.reason,
          isUser: b.is_user,
        })),
        userRank: row.user_rank,
        cached: row.cached,
        queryId: row.id,
        model: row.model as VisibilityResponse["model"],
        searchedAt: row.created_at.toISOString(),
        category: row.category,
      };

      return {
        keyword: row.keyword,
        store: row.store,
        rawStore: row.raw_store,
        category: row.category,
        result,
        createdAt: row.created_at,
      };
    },

    async put(record: VisibilityRecord): Promise<void> {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const q = await client.query<{ id: string }>(
          `INSERT INTO queries (keyword, store, raw_store, category, user_rank, cached, model)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            record.keyword,
            record.store,
            record.rawStore,
            record.category,
            record.result.userRank,
            record.result.cached,
            record.result.model,
          ],
        );
        const queryId = q.rows[0].id;

        for (const r of record.result.results) {
          await client.query(
            `INSERT INTO ranked_brands (query_id, rank, brand, url, reason, is_user)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [queryId, r.rank, r.brand, r.url, r.reason, r.isUser],
          );
        }

        await client.query(
          `INSERT INTO category_top_keywords (category, keyword, query_count, last_seen)
           VALUES ($1, $2, 1, now())
           ON CONFLICT (category, keyword)
           DO UPDATE SET query_count = category_top_keywords.query_count + 1, last_seen = now()`,
          [record.category, record.keyword],
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
