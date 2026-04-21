import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.admin_token;
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (!payload.sub) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    (req as Request & { adminUser: string }).adminUser = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
