import { describe, it, expect } from "vitest";
import { parseEnv } from "./env.js";

describe("parseEnv", () => {
  it("parses a valid env and applies defaults", () => {
    const env = parseEnv({ OPENAI_API_KEY: "sk-test" });
    expect(env.OPENAI_API_KEY).toBe("sk-test");
    expect(env.PORT).toBe(8787);
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
    expect(env.STORE_DRIVER).toBe("memory");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("throws when OPENAI_API_KEY is missing", () => {
    expect(() => parseEnv({})).toThrow(/OPENAI_API_KEY/);
  });

  it("coerces PORT to a number", () => {
    const env = parseEnv({ OPENAI_API_KEY: "sk-test", PORT: "9000" });
    expect(env.PORT).toBe(9000);
  });

  it("rejects unknown STORE_DRIVER values", () => {
    expect(() =>
      parseEnv({ OPENAI_API_KEY: "sk-test", STORE_DRIVER: "mongodb" }),
    ).toThrow();
  });

  it("allows missing DATABASE_URL/JWT_SECRET when STORE_DRIVER=memory", () => {
    const env = parseEnv({ OPENAI_API_KEY: "sk-test", STORE_DRIVER: "memory" });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.JWT_SECRET).toBeUndefined();
  });

  it("throws when STORE_DRIVER=postgres but DATABASE_URL missing", () => {
    expect(() =>
      parseEnv({ OPENAI_API_KEY: "sk-test", STORE_DRIVER: "postgres", JWT_SECRET: "secret" }),
    ).toThrow(/DATABASE_URL/);
  });

  it("throws when STORE_DRIVER=postgres but JWT_SECRET missing", () => {
    expect(() =>
      parseEnv({ OPENAI_API_KEY: "sk-test", STORE_DRIVER: "postgres", DATABASE_URL: "postgres://localhost/qck" }),
    ).toThrow(/JWT_SECRET/);
  });

  it("parses postgres env with all required fields", () => {
    const env = parseEnv({
      OPENAI_API_KEY: "sk-test",
      STORE_DRIVER: "postgres",
      DATABASE_URL: "postgres://localhost/qck",
      JWT_SECRET: "my-secret",
      ADMIN_PASSWORD_HASH: "$2a$10$somehash",
    });
    expect(env.STORE_DRIVER).toBe("postgres");
    expect(env.DATABASE_URL).toBe("postgres://localhost/qck");
    expect(env.JWT_SECRET).toBe("my-secret");
    expect(env.ADMIN_PASSWORD_HASH).toBe("$2a$10$somehash");
  });
});
