import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";
import { getAdminPasswordHash, setAdminPasswordHash, hashPassword } from "../../lib/auth.js";
import { getEnv } from "../../lib/env.js";

const router = Router();

const CONFIG_KEYS: Record<string, string> = {
  openaiApiKey: "openai_api_key",
  queryRetentionDays: "query_retention_days",
  rateLimitChecksPerHour: "rate_limit_checks_per_hour",
  rateLimitMaxResults: "rate_limit_max_results",
  rateLimitScanTimeoutMs: "rate_limit_scan_timeout_ms",
  flagPublicChecker: "flag_public_checker",
  flagRequireSignup: "flag_require_signup",
  flagCompetitorTracking: "flag_competitor_tracking",
  flagAutoBlockAbuse: "flag_auto_block_abuse",
  maintenanceMode: "maintenance_mode",
};

async function getConfigValue(pool: ReturnType<typeof getPool>, key: string): Promise<string> {
  const result = await pool.query<{ value: string }>(
    "SELECT value FROM config WHERE key = $1 LIMIT 1",
    [key],
  );
  return result.rows[0]?.value ?? "";
}

async function setConfigValue(pool: ReturnType<typeof getPool>, key: string, value: string) {
  await pool.query(
    `INSERT INTO config (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, value],
  );
}

function parseBool(value: string): boolean {
  return value === "true";
}

function toNumber(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

router.get("/config", async (_req, res) => {
  const pool = getPool();
  const env = getEnv();

  const [openaiKey, rateLimitChecks, rateLimitMax, rateLimitTimeout,
    retention, flagPublic, flagSignup, flagCompetitor, flagAutoBlock,
    maintenanceMode] = await Promise.all([
    getConfigValue(pool, "openai_api_key"),
    getConfigValue(pool, "rate_limit_checks_per_hour"),
    getConfigValue(pool, "rate_limit_max_results"),
    getConfigValue(pool, "rate_limit_scan_timeout_ms"),
    getConfigValue(pool, "query_retention_days"),
    getConfigValue(pool, "flag_public_checker"),
    getConfigValue(pool, "flag_require_signup"),
    getConfigValue(pool, "flag_competitor_tracking"),
    getConfigValue(pool, "flag_auto_block_abuse"),
    getConfigValue(pool, "maintenance_mode"),
  ]);

  const hasPassword = !!(env.ADMIN_PASSWORD_HASH || (await getAdminPasswordHash()));

  res.json({
    openaiApiKeyStatus: openaiKey ? "active" : "not_set",
    openaiApiKeyMasked: openaiKey
      ? `sk-${openaiKey.slice(0, 10)}***${openaiKey.slice(-4)}`
      : "",
    adminPasswordSet: hasPassword,
    queryRetentionDays: toNumber(retention, 90),
    serverVersion: "1.0.0",
    rateLimitChecksPerHour: toNumber(rateLimitChecks, 60),
    rateLimitMaxResults: toNumber(rateLimitMax, 10),
    rateLimitScanTimeoutMs: toNumber(rateLimitTimeout, 8000),
    flagPublicChecker: parseBool(flagPublic),
    flagRequireSignup: parseBool(flagSignup),
    flagCompetitorTracking: parseBool(flagCompetitor),
    flagAutoBlockAbuse: parseBool(flagAutoBlock),
    maintenanceMode: parseBool(maintenanceMode),
  });
});

const PatchConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  queryRetentionDays: z.number().int().positive().optional(),
  adminPassword: z.string().min(8, "password must be at least 8 characters").optional(),
  rateLimitChecksPerHour: z.number().int().positive().optional(),
  rateLimitMaxResults: z.number().int().positive().optional(),
  rateLimitScanTimeoutMs: z.number().int().positive().optional(),
  flagPublicChecker: z.boolean().optional(),
  flagRequireSignup: z.boolean().optional(),
  flagCompetitorTracking: z.boolean().optional(),
  flagAutoBlockAbuse: z.boolean().optional(),
});

router.patch("/config", async (req, res) => {
  const parsed = PatchConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const pool = getPool();
  const updates = parsed.data;

  if (updates.openaiApiKey !== undefined) {
    await setConfigValue(pool, "openai_api_key", updates.openaiApiKey);
  }

  if (updates.adminPassword) {
    const hash = await hashPassword(updates.adminPassword);
    await setAdminPasswordHash(hash);
  }

  const writePromises: Promise<unknown>[] = [];
  for (const [camelKey, configKey] of Object.entries(CONFIG_KEYS)) {
    if (camelKey === "openaiApiKey" || camelKey === "queryRetentionDays" || camelKey === "adminPassword") continue;
    const value = (updates as Record<string, unknown>)[camelKey];
    if (value !== undefined) {
      writePromises.push(setConfigValue(pool, configKey, String(value)));
    }
  }

  await Promise.all(writePromises);
  res.json({ ok: true });
});

const ConfigActionSchema = z.object({
  action: z.enum(["enable_maintenance", "disable_maintenance", "purge_cache"]),
});

router.post("/config/actions", async (req, res) => {
  const parsed = ConfigActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const pool = getPool();
  const { action } = parsed.data;

  if (action === "enable_maintenance") {
    await setConfigValue(pool, "maintenance_mode", "true");
  } else if (action === "disable_maintenance") {
    await setConfigValue(pool, "maintenance_mode", "false");
  } else if (action === "purge_cache") {
    await pool.query("UPDATE queries SET cached = false");
  }

  res.json({ ok: true });
});

export default router;
