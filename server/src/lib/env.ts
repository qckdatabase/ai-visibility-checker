import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  STORE_DRIVER: z.enum(["memory", "postgres"]).default("memory"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  STATIC_DIR: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }

  const env = parsed.data;

  if (env.STORE_DRIVER === "postgres") {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when STORE_DRIVER=postgres");
    }
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required when STORE_DRIVER=postgres");
    }
  }

  return env;
}

// Lazily-loaded singleton for production use (index.ts calls getEnv()).
let cached: Env | null = null;
export function getEnv(): Env {
  if (cached) return cached;
  cached = parseEnv(process.env);
  return cached;
}
