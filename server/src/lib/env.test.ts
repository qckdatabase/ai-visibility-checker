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
});
