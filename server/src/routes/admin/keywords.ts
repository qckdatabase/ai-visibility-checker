import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";

const router = Router();

const ListQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["volume", "trending"]).default("volume"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get("/keywords", async (req, res) => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const { category, page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const pool = getPool();

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let idx = 1;

  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const topKeywordsResult = await pool.query(
    `SELECT keyword, category, query_count, last_seen
     FROM category_top_keywords ${where}
     ORDER BY query_count DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );

  const categoryBreakdownResult = await pool.query(
    `SELECT category, COUNT(*) as count
     FROM queries
     GROUP BY category
     ORDER BY count DESC`,
  );

  const weekAgo = await pool.query<{ keyword: string; category: string; count: string }>(
    `SELECT keyword, category, COUNT(*) as count
     FROM queries
     WHERE created_at > now() - interval '7 days' AND created_at <= now() - interval '14 days'
     GROUP BY keyword, category`,
  );
  const weekAgoMap = new Map(weekAgo.rows.map((r) => [`${r.keyword}:${r.category}`, parseInt(r.count, 10)]));

  const trendingKeywordsResult = await pool.query(
    `SELECT keyword, category, COUNT(*) as count
     FROM queries
     WHERE created_at > now() - interval '7 days'
     GROUP BY keyword, category
     ORDER BY count DESC LIMIT 20`,
  );

  const trendingKeywords = trendingKeywordsResult.rows.map((r) => {
    const prevCount = weekAgoMap.get(`${r.keyword}:${r.category}`) ?? 0;
    const currCount = parseInt(r.count, 10);
    return {
      keyword: r.keyword,
      category: r.category,
      delta: currCount - prevCount,
    };
  });

  res.json({
    topKeywords: topKeywordsResult.rows.map((r) => ({
      keyword: r.keyword,
      category: r.category,
      queryCount: r.query_count,
      lastSeen: r.last_seen.toISOString(),
    })),
    categoryBreakdown: categoryBreakdownResult.rows.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
    })),
    trendingKeywords,
  });
});

export default router;
