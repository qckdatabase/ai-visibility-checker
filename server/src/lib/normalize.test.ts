import { describe, it, expect } from "vitest";
import { normalize, cacheKey } from "./normalize.js";

describe("normalize", () => {
  it("lowercases", () => expect(normalize("Example")).toBe("example"));
  it("trims", () => expect(normalize("  shop  ")).toBe("shop"));
  it("strips leading www.", () => expect(normalize("www.store.com")).toBe("store.com"));
  it("strips trailing slash", () => expect(normalize("store.com/")).toBe("store.com"));
  it("handles combo", () => expect(normalize("  WwW.Store.Com/  ")).toBe("store.com"));
});

describe("cacheKey", () => {
  it("produces stable key", () => {
    expect(cacheKey("shoes", "Nike.com")).toBe("shoes|nike.com");
    expect(cacheKey("SHOES", "NIKE.COM/")).toBe("shoes|nike.com");
  });
});
