import { describe, expect, test, vi } from "vitest";

vi.mock("./openai.js", () => ({
  getOpenAIClient: () => ({
    responses: {
      create: vi.fn().mockResolvedValue({ output_text: "example.com" }),
    },
  }),
}));

import { resolveDomain } from "./resolveDomain";

describe("resolveDomain", () => {
  test("returns domain when input contains a dot (lowercased)", async () => {
    const res = await resolveDomain("  Lumen-Skin.COM  ");
    expect(res).toBe("lumen-skin.com");
  });

  test("resolves brand name via GPT-4o when no dot", async () => {
    const res = await resolveDomain("Lumen Skin");
    expect(res).toBe("example.com");
  });

  test("returns unknown for empty input", async () => {
    const res = await resolveDomain("   ");
    expect(res).toBe("unknown");
  });
});
