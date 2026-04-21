import { Router } from "express";
import { getPool } from "../../db/index.js";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  const pool = getPool();

  const [
    totalResult,
    keywordsResult,
    storesResult,
    cacheResult,
    categoriesResult,
    queriesOverTimeResult,
    topKeywordsResult,
    topStoresResult,
  ] = await Promise.all([
    pool.query<{ count: string }>("SELECT COUNT(*) as count FROM queries"),
    pool.query<{ count: string }>("SELECT COUNT(DISTINCT keyword) as count FROM queries"),
    pool.query<{ count: string }>("SELECT COUNT(DISTINCT store) as count FROM queries"),
    pool.query<{ count: string; total: string }>(
      "SELECT COUNT(*) FILTER (WHERE cached = true) as count, COUNT(*) as total FROM queries",
    ),
    pool.query<{ category: string; count: string }>(
      "SELECT category, COUNT(*) as count FROM queries GROUP BY category ORDER BY count DESC LIMIT 10",
    ),
    pool.query<{ day: string; queries: string }>(
      `SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as queries
       FROM queries
       WHERE created_at > now() - interval '14 days'
       GROUP BY day
       ORDER BY day ASC`,
    ),
    pool.query<{ keyword: string; count: string }>(
      `SELECT keyword, COUNT(*) as count
       FROM queries
       WHERE created_at > now() - interval '7 days'
       GROUP BY keyword
       ORDER BY count DESC LIMIT 10`,
    ),
    pool.query<{ store: string; query_count: string; avg_rank: number | null }>(
      `SELECT store, COUNT(*) as query_count,
              AVG(user_rank) FILTER (WHERE user_rank IS NOT NULL)::float as avg_rank
       FROM queries
       GROUP BY store
       ORDER BY query_count DESC LIMIT 10`,
    ),
  ]);

  const total = parseInt(totalResult.rows[0]?.count ?? "0", 10);
  const cacheCount = parseInt(cacheResult.rows[0]?.count ?? "0", 10);
  const cacheTotal = parseInt(cacheResult.rows[0]?.total ?? "1", 10);

  res.json({
    totalQueries: total,
    uniqueKeywords: parseInt(keywordsResult.rows[0]?.count ?? "0", 10),
    uniqueStores: parseInt(storesResult.rows[0]?.count ?? "0", 10),
    cacheHitRate: cacheTotal > 0 ? Math.round((cacheCount / cacheTotal) * 100) : 0,
    topCategories: categoriesResult.rows.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
    })),
    queriesOverTime: queriesOverTimeResult.rows.map((r) => ({
      day: r.day,
      queries: parseInt(r.queries, 10),
    })),
    topKeywords: topKeywordsResult.rows.map((r) => ({
      keyword: r.keyword,
      count: parseInt(r.count, 10),
    })),
    topStores: topStoresResult.rows.map((r) => ({
      store: r.store,
      queryCount: parseInt(r.query_count, 10),
      avgRank: r.avg_rank,
    })),
  });
});

export default router;
