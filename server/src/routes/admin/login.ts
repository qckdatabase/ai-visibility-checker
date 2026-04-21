import { Router } from "express";
import { z } from "zod";
import { comparePassword, getAdminPasswordHash, signToken } from "../../lib/auth.js";

const router = Router();

const LoginSchema = z.object({
  password: z.string().min(1, "password is required"),
});

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input", message: parsed.error.errors[0].message });
    return;
  }

  const { password } = parsed.data;
  const hash = await getAdminPasswordHash();

  if (!hash) {
    res.status(401).json({ error: "unauthorized", message: "Admin password not configured" });
    return;
  }

  const valid = await comparePassword(password, hash);
  if (!valid) {
    res.status(401).json({ error: "unauthorized", message: "Incorrect password" });
    return;
  }

  const token = signToken({ sub: "admin" });
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

export default router;
