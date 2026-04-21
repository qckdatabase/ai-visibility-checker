import { Router } from "express";
import { z } from "zod";
import { getPool } from "../../db/index.js";
import { getAdminPasswordHash, setAdminPasswordHash, hashPassword } from "../../lib/auth.js";
import { getEnv } from "../../lib/env.js";

const router = Router();

router.get("/config", async (_req, res) => {
  const pool = getPool();
  const keyResult = await pool.query<{ value: string }>(
    "SELECT value FROM config WHERE key = 'openai_api_key' LIMIT 1",
  );
  const openaiKey = keyResult.rows[0]?.value ?? "";
  const env = getEnv();

  const hasPassword = !!(env.ADMIN_PASSWORD_HASH || (await getAdminPasswordHash()));

  res.json({
    openaiApiKeyStatus: openaiKey ? "active" : "not_set",
    openaiApiKeyMasked: openaiKey
      ? `sk-${openaiKey.slice(0, 10)}***${openaiKey.slice(-4)}`
      : "",
    adminPasswordSet: hasPassword,
    queryRetentionDays: 90,
    serverVersion: "1.0.0",
  });
});

const PatchConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  queryRetentionDays: z.number().int().positive().optional(),
  adminPassword: z.string().min(8, "password must be at least 8 characters").optional(),
});

router.patch("/config", async (req, res) => {
  const parsed = PatchConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const pool = getPool();
  const { openaiApiKey, adminPassword } = parsed.data;

  if (openaiApiKey !== undefined) {
    await pool.query(
      `INSERT INTO config (key, value) VALUES ('openai_api_key', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [openaiApiKey],
    );
  }

  if (adminPassword) {
    const hash = await hashPassword(adminPassword);
    await setAdminPasswordHash(hash);
  }

  res.json({ ok: true });
});

export default router;
