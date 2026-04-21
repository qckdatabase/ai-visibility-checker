import { Router } from "express";
import { getPool } from "../../db/index.js";

const router = Router();

router.get("/top-stores", async (_req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       q.category,
       q.keyword,
       rb.brand,
       rb.url,
       rb.rank,
       COUNT(*) OVER (PARTITION BY q.category, q.keyword) as total_queries_for_keyword
     FROM queries q
     JOIN ranked_brands rb ON rb.query_id = q.id AND rb.rank = 1
     WHERE q.created_at > now() - interval '30 days'
     ORDER BY q.category, total_queries_for_keyword DESC,
       CASE WHEN rb.rank = 1 THEN 0 ELSE 1 END`,
  );

  const rows = result.rows.map((r) => ({
    category: r.category,
    keyword: r.keyword,
    brand: r.brand,
    url: r.url,
    rank: r.rank,
  }));

  res.json(rows);
});

export default router;
