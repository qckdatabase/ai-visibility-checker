import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";

const router = Router();

const ListQuerySchema = z.object({
  keyword: z.string().optional(),
  store: z.string().optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get("/queries", async (req, res) => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const { keyword, store, category, from, to, page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const pool = getPool();

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIdx = 1;

  if (keyword) {
    conditions.push(`keyword ILIKE $${paramIdx++}`);
    params.push(`%${keyword}%`);
  }
  if (store) {
    conditions.push(`store ILIKE $${paramIdx++}`);
    params.push(`%${store}%`);
  }
  if (category) {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }
  if (from) {
    conditions.push(`created_at >= $${paramIdx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`created_at <= $${paramIdx++}`);
    params.push(to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM queries ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const rowsResult = await pool.query(
    `SELECT id, keyword, store, category, user_rank, cached, created_at
     FROM queries ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );

  res.json({
    rows: rowsResult.rows.map((r) => ({
      id: r.id,
      keyword: r.keyword,
      store: r.store,
      category: r.category,
      userRank: r.user_rank,
      cached: r.cached,
      createdAt: r.created_at.toISOString(),
    })),
    total,
    page,
    pageSize: limit,
  });
});

router.get("/queries/:id/brands", async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT rank, brand, url, is_user
     FROM ranked_brands
     WHERE query_id = $1
     ORDER BY rank`,
    [req.params.id],
  );
  res.json({
    brands: result.rows.map((b) => ({
      rank: b.rank,
      brand: b.brand,
      url: b.url,
      isUser: b.is_user,
    })),
  });
});

export default router;
