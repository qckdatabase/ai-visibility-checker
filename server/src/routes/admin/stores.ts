import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";

const router = Router();

const ListQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

router.get("/stores", async (req, res) => {
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
    conditions.push(`q.category = $${idx++}`);
    params.push(category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(DISTINCT q.store) as count FROM queries q ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const rowsResult = await pool.query(
    `SELECT
       q.store,
       COUNT(*) as query_count,
       MAX(q.created_at) as last_seen,
       AVG(q.user_rank) FILTER (WHERE q.user_rank IS NOT NULL)::float as last_user_rank,
       (
         SELECT AVG(rb.rank)::float
         FROM ranked_brands rb
         JOIN queries sq ON sq.id = rb.query_id
         WHERE sq.store = q.store AND rb.is_user = true
       ) as avg_rank
     FROM queries q
     ${where}
     GROUP BY q.store
     ORDER BY query_count DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset],
  );

  res.json({
    rows: rowsResult.rows.map((r) => ({
      store: r.store,
      queryCount: parseInt(r.query_count, 10),
      lastSeen: r.last_seen?.toISOString() ?? null,
      avgRank: r.avg_rank,
      lastUserRank: r.last_user_rank,
    })),
    total,
  });
});

export default router;
