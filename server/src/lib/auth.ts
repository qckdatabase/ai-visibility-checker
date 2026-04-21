import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db/index.js";
import { getEnv } from "./env.js";

const JWT_EXPIRY = "8h";

export function signToken(payload: object): string {
  const env = getEnv();
  const secret = env.JWT_SECRET ?? "dev-only-secret-do-not-use-in-production";
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): jwt.JwtPayload {
  const env = getEnv();
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAdminPasswordHash(): Promise<string | null> {
  const env = getEnv();
  if (env.ADMIN_PASSWORD_HASH) {
    return env.ADMIN_PASSWORD_HASH;
  }
  const pool = getPool();
  const result = await pool.query<{ value: string }>(
    "SELECT value FROM config WHERE key = 'admin_password' LIMIT 1",
  );
  if (result.rowCount === 0) return null;
  return result.rows[0].value || null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO config (key, value) VALUES ('admin_password', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [hash],
  );
}
