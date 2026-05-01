import { Router, type Request } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { runPipeline } from "../pipeline/index.js";
import { PipelineError } from "../lib/errors.js";
import type { VisibilityResponse } from "../types.js";
import { getEnv } from "../lib/env.js";
import { getPool } from "../db/index.js";

const router = Router();

const FREE_CHECK_LIMIT = 10;

const QuerySchema = z.object({
  keyword: z.string().trim().min(1, "keyword is required"),
  store: z.string().trim().min(1, "store is required"),
  consent: z.boolean().default(false),
});

function errorResponse(code: string, message: string, status: number) {
  return { error: code, message, status };
}

function getMemoryUsage(req: Request) {
  req.app.locals.visibilityIpUsage ??= new Map<string, number>();
  return req.app.locals.visibilityIpUsage as Map<string, number>;
}

async function reserveVisibilityCheck(req: Request, storeDriver: string, ipAddress: string) {
  if (storeDriver !== "postgres") {
    const usage = getMemoryUsage(req);
    const count = usage.get(ipAddress) ?? 0;
    if (count >= FREE_CHECK_LIMIT) return false;
    usage.set(ipAddress, count + 1);
    return true;
  }

  const pool = getPool();
  const result = await pool.query<{ check_count: number }>(
    `INSERT INTO visibility_ip_usage (ip_address, check_count, first_seen, last_seen)
     VALUES ($1, 1, now(), now())
     ON CONFLICT (ip_address) DO UPDATE
     SET check_count = visibility_ip_usage.check_count + 1,
         last_seen = now()
     WHERE visibility_ip_usage.check_count < $2
     RETURNING check_count`,
    [ipAddress, FREE_CHECK_LIMIT],
  );

  return (result.rowCount ?? 0) > 0;
}

async function refundVisibilityCheck(req: Request, storeDriver: string, ipAddress: string) {
  if (storeDriver !== "postgres") {
    const usage = getMemoryUsage(req);
    const count = usage.get(ipAddress) ?? 0;
    usage.set(ipAddress, Math.max(0, count - 1));
    return;
  }

  const pool = getPool();
  await pool.query(
    `UPDATE visibility_ip_usage
     SET check_count = GREATEST(check_count - 1, 0),
         last_seen = now()
     WHERE ip_address = $1`,
    [ipAddress],
  );
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
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

  let checkReserved = false;
  try {
    checkReserved = await reserveVisibilityCheck(req, env.STORE_DRIVER, ipAddress);
  } catch (dbErr) {
    log({ error: "rate_limit_failed", message: String(dbErr) });
    return res.status(500).json(errorResponse("internal", "An unexpected error occurred", 500));
  }

  if (!checkReserved) {
    log({ error: "rate_limited", ipAddress });
    return res.status(429).json(errorResponse("rate_limited", "You have reached the free visibility check limit.", 429));
  }

  // Log consent to DB if postgres driver is active
  if (consent && env.STORE_DRIVER === "postgres") {
    try {
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
    if (checkReserved) {
      try {
        await refundVisibilityCheck(req, env.STORE_DRIVER, ipAddress);
      } catch (dbErr) {
        log({ error: "rate_limit_refund_failed", message: String(dbErr) });
      }
    }
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
