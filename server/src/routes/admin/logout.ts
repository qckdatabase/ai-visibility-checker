import { Router } from "express";

const router = Router();

router.post("/logout", (_req, res) => {
  res.clearCookie("admin_token", { path: "/" });
  res.json({ ok: true });
});

export default router;
