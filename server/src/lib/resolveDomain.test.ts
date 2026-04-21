import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveDomain } from "./resolveDomain.js";

const mockCreate = vi.fn();

vi.mock("./openai.js", () => ({
  getOpenAIClient: () => ({
    responses: { create: mockCreate },
  }),
}));

describe("resolveDomain", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns domain as-is when it already contains a dot", async () => {
    const result = await resolveDomain("lumen-skin.com");
    expect(result).toBe("lumen-skin.com");
  });

  it("lowercases and trims domain with dot", async () => {
    const result = await resolveDomain("Lumen-Skin.COM");
    expect(result).toBe("lumen-skin.com");
  });

  it("calls GPT when input has no dot and returns resolved domain", async () => {
    mockCreate.mockResolvedValue({ output_text: "lumen-skin.com" });

    const result = await resolveDomain("Lumen Skin");

    expect(mockCreate).toHaveBeenCalled();
    expect(result).toBe("lumen-skin.com");
  });

  it("returns 'unknown' when GPT returns 'unknown'", async () => {
    mockCreate.mockResolvedValue({ output_text: "unknown" });

    const result = await resolveDomain("obscure brand xyz");

    expect(result).toBe("unknown");
  });

  it("returns 'unknown' when GPT returns a non-domain string", async () => {
    mockCreate.mockResolvedValue({ output_text: "not sure" });

    const result = await resolveDomain("ambiguous");

    expect(result).toBe("unknown");
  });

  it("returns 'unknown' when GPT throws", async () => {
    mockCreate.mockRejectedValue(new Error("API error"));

    const result = await resolveDomain("Nike");

    expect(result).toBe("unknown");
  });

  it("trims whitespace before GPT resolution", async () => {
    mockCreate.mockResolvedValue({ output_text: "example.com" });

    const result = await resolveDomain("  nike  ");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.arrayContaining([
          expect.objectContaining({ content: expect.stringContaining("nike") }),
        ]),
      }),
    );
    expect(result).toBe("example.com");
  });
});
