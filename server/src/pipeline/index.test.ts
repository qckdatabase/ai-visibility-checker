import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPipeline, PipelineError } from "./index.js";
import type { QueryStore, VisibilityRecord } from "../store/types.js";
import * as search from "./search.js";
import * as format from "./format.js";
import * as store from "../store/index.js";
import * as resolveDomain from "../lib/resolveDomain.js";

vi.mock("../db/index.js", () => ({}));
vi.mock("../db/pgStore.js", () => ({ createPgStore: vi.fn() }));
vi.mock("../store/index.js", () => ({ getStore: vi.fn(), createMemoryStore: vi.fn() }));
vi.mock("./search.js", () => ({
  groundedSearch: vi.fn(),
}));
vi.mock("./format.js", () => ({
  formatToJSON: vi.fn(),
}));
vi.mock("../lib/resolveDomain.js", () => ({ resolveDomain: vi.fn() }));

function mockStore(overrides?: Partial<QueryStore>): QueryStore {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn(),
    ...overrides,
  } as QueryStore;
}

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached result with cached:true on cache hit", async () => {
    const cachedRecord: VisibilityRecord = {
      keyword: "shoes",
      store: "nike.com",
      category: "Apparel",
      result: {
        results: [],
        userRank: null,
        cached: true,
        queryId: "cached-id",
        model: "gpt-4o",
        searchedAt: "2024-01-01T00:00:00Z",
        category: "Apparel",
      },
      createdAt: new Date(),
    };
    vi.spyOn(store, "getStore").mockReturnValue(mockStore({
      get: vi.fn().mockResolvedValue(cachedRecord),
    }));
    vi.spyOn(resolveDomain, "resolveDomain").mockResolvedValue("nike.com");

    const result = await runPipeline("shoes", "nike.com");
    expect(result.cached).toBe(true);
    expect(result.queryId).toBe("cached-id");
  });

  it("calls stage 1 then stage 2 on cache miss", async () => {
    vi.spyOn(store, "getStore").mockReturnValue(mockStore());
    vi.spyOn(resolveDomain, "resolveDomain").mockResolvedValue("nike.com");
    vi.spyOn(search, "groundedSearch").mockResolvedValue({
      rankings: [
        { rank: 1, brand: "Nike", reason: "Great shoes.", url: "https://nike.com" },
        { rank: 2, brand: "Adidas", reason: "Popular brand.", url: "https://adidas.com" },
        { rank: 3, brand: "Puma", reason: "Good quality.", url: "https://puma.com" },
        { rank: 4, brand: "New Balance", reason: "Comfortable.", url: "https://newbalance.com" },
        { rank: 5, brand: "Reebok", reason: "Affordable.", url: "https://reebok.com" },
      ],
    });
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [
        { rank: 1, brand: "Nike", reason: "Great shoes.", url: "https://nike.com", isUser: false },
        { rank: 2, brand: "Adidas", reason: "Popular brand.", url: "https://adidas.com", isUser: false },
        { rank: 3, brand: "Puma", reason: "Good quality.", url: "https://puma.com", isUser: false },
        { rank: 4, brand: "New Balance", reason: "Comfortable.", url: "https://newbalance.com", isUser: false },
        { rank: 5, brand: "Reebok", reason: "Affordable.", url: "https://reebok.com", isUser: false },
      ],
      category: "Apparel",
    });

    const result = await runPipeline("shoes", "nike.com");
    expect(resolveDomain.resolveDomain).toHaveBeenCalledWith("nike.com");
    expect(search.groundedSearch).toHaveBeenCalledWith("shoes", "nike.com");
    expect(format.formatToJSON).toHaveBeenCalled();
    expect(result.cached).toBe(false);
    expect(result.category).toBe("Apparel");
  });

  it("throws PipelineError when stage 2 returns < 5 entries", async () => {
    vi.spyOn(store, "getStore").mockReturnValue(mockStore());
    vi.spyOn(resolveDomain, "resolveDomain").mockResolvedValue("nike.com");
    vi.spyOn(search, "groundedSearch").mockResolvedValue({
      rankings: [{ rank: 1, brand: "A", reason: "R", url: "https://a.com" }],
    });
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [{ rank: 1, brand: "A", reason: "R", url: "https://a.com", isUser: false }],
      category: "Apparel",
    });

    await expect(runPipeline("shoes", "nike.com")).rejects.toThrow(PipelineError);
    try {
      await runPipeline("shoes", "nike.com");
    } catch (err) {
      expect((err as PipelineError).code).toBe("upstream_failed");
    }
  });
});
