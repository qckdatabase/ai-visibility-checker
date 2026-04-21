import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";
import { getAdminPasswordHash, setAdminPasswordHash, hashPassword } from "../../lib/auth.js";
import { getEnv } from "../../lib/env.js";

const router = Router();

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

router.get("/config", async (_req, res) => {
  const pool = getPool();
  const env = getEnv();

  const [openaiKey, maintenanceMode] = await Promise.all([
    getConfigValue(pool, "openai_api_key"),
    getConfigValue(pool, "maintenance_mode"),
  ]);

  const hasPassword = !!(env.ADMIN_PASSWORD_HASH || (await getAdminPasswordHash()));

  res.json({
    openaiApiKeyStatus: openaiKey ? "active" : "not_set",
    openaiApiKeyMasked: openaiKey
      ? `sk-${openaiKey.slice(0, 10)}***${openaiKey.slice(-4)}`
      : "",
    adminPasswordSet: hasPassword,
    maintenanceMode: maintenanceMode === "true",
    serverVersion: "1.0.0",
  });
});

const PatchConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  adminPassword: z.string().min(8, "password must be at least 8 characters").optional(),
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
