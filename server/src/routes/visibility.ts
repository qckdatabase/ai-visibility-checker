import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { runPipeline } from "../pipeline/index.js";
import { PipelineError } from "../lib/errors.js";
import type { VisibilityResponse } from "../types.js";
import { getEnv } from "../lib/env.js";

const router = Router();

// TODO: rate limiting

const QuerySchema = z.object({
  keyword: z.string().trim().min(1, "keyword is required"),
  store: z.string().trim().min(1, "store is required"),
  consent: z.boolean().default(false),
});

function errorResponse(code: string, message: string, status: number) {
  return { error: code, message, status };
}

router.post("/api/visibility", async (req, res) => {
  const requestId = uuidv4();
  const env = getEnv();
  const log = (data: Record<string, unknown>) => {
    console.log(JSON.stringify({ requestId, ...data }));
  };

  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    log({ error: "invalid_input" });
    return res.status(400).json(errorResponse("invalid_input", parsed.error.errors[0].message, 400));
  }

  const { keyword, store, consent } = parsed.data;

  // Log consent to DB if postgres driver is active
  if (consent && env.STORE_DRIVER === "postgres") {
    try {
      const { getPool } = await import("../db/index.js");
      const pool = getPool();
      await pool.query(
        `INSERT INTO consents (keyword, store, ip_address, created_at)
         VALUES ($1, $2, $3, now())`,
        [keyword, store, req.ip ?? null],
      );
    } catch (dbErr) {
      // Non-fatal: log but don't block the request
      log({ error: "consent_log_failed", message: String(dbErr) });
    }
  }

  try {
    const start = Date.now();
    const result: VisibilityResponse = await runPipeline(keyword, store);
    log({ keyword, store, cached: result.cached, resultCount: result.results.length, category: result.category, totalMs: Date.now() - start });
    return res.json(result);
  } catch (err: unknown) {
    if (err instanceof PipelineError) {
      log({ error: err.code, message: err.message });
      const status = err.code === "invalid_input" ? 400 : 502;
      return res.status(status).json(errorResponse(err.code, err.message, status));
    }
    if (err instanceof Error) {
      log({ error: "upstream_failed", message: err.message });
      return res.status(502).json(errorResponse("upstream_failed", err.message, 502));
    }
    log({ error: "internal", message: String(err) });
    return res.status(500).json(errorResponse("internal", "An unexpected error occurred", 500));
  }
});

export default router;
