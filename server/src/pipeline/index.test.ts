import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPipeline, PipelineError } from "./index.js";
import type { QueryStore, VisibilityRecord } from "../store/types.js";
import * as search from "./search.js";
import * as format from "./format.js";
import * as store from "../store/index.js";

vi.mock("../store/index.js");
vi.mock("./search.js");
vi.mock("./format.js");

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
      result: {
        results: [],
        userRank: null,
        cached: true,
        queryId: "cached-id",
        model: "gpt-4o",
        searchedAt: "2024-01-01T00:00:00Z",
      },
      createdAt: new Date(),
    };
    vi.spyOn(store, "getStore").mockReturnValue(mockStore({
      get: vi.fn().mockResolvedValue(cachedRecord),
    }));

    const result = await runPipeline("shoes", "nike.com");
    expect(result.cached).toBe(true);
    expect(result.queryId).toBe("cached-id");
  });

  it("calls stage 1 then stage 2 on cache miss", async () => {
    vi.spyOn(store, "getStore").mockReturnValue(mockStore());
    vi.spyOn(search, "groundedSearch").mockResolvedValue("1. Nike - Great shoes.");
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [
        { rank: 1, brand: "Nike", reason: "Great shoes.", isUser: false },
        { rank: 2, brand: "Adidas", reason: "Popular brand.", isUser: false },
        { rank: 3, brand: "Puma", reason: "Good quality.", isUser: false },
        { rank: 4, brand: "New Balance", reason: "Comfortable.", isUser: false },
        { rank: 5, brand: "Reebok", reason: "Affordable.", isUser: false },
      ],
    });

    const result = await runPipeline("shoes", "nike.com");
    expect(search.groundedSearch).toHaveBeenCalledWith("shoes", "nike.com");
    expect(format.formatToJSON).toHaveBeenCalled();
    expect(result.cached).toBe(false);
  });

  it("throws PipelineError when stage 2 returns < 5 entries", async () => {
    vi.spyOn(store, "getStore").mockReturnValue(mockStore());
    vi.spyOn(search, "groundedSearch").mockResolvedValue("1. A");
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [{ rank: 1, brand: "A", reason: "R", isUser: false }],
    });

    await expect(runPipeline("shoes", "nike.com")).rejects.toThrow(PipelineError);
    try {
      await runPipeline("shoes", "nike.com");
    } catch (err) {
      expect((err as PipelineError).code).toBe("upstream_failed");
    }
  });
});
