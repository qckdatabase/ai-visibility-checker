import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryStore } from "./memoryStore.js";

describe("createMemoryStore", () => {
  let store: ReturnType<typeof createMemoryStore>;

  beforeEach(() => {
    store = createMemoryStore();
  });

  it("returns null on miss", async () => {
    const result = await store.get("shoes", "nike.com");
    expect(result).toBeNull();
  });

  it("stores and retrieves a record", async () => {
    const record = {
      keyword: "shoes",
      store: "nike.com",
      result: {
        results: [],
        userRank: null,
        cached: false,
        queryId: "x",
        model: "gpt-4o" as const,
        searchedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    };
    await store.put(record);
    const found = await store.get("shoes", "nike.com");
    expect(found).not.toBeNull();
    expect(found!.result.queryId).toBe("x");
  });

  it("cache key is case-insensitive", async () => {
    const record = {
      keyword: "Shoes",
      store: "Nike.com/",
      result: {
        results: [],
        userRank: null,
        cached: false,
        queryId: "y",
        model: "gpt-4o" as const,
        searchedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    };
    await store.put(record);
    const found = await store.get("shoes", "nike.com");
    expect(found).not.toBeNull();
  });

  it("evicts oldest when at capacity", async () => {
    for (let i = 0; i < 500; i++) {
      await store.put({
        keyword: `k${i}`,
        store: "s.com",
        result: {
          results: [],
          userRank: null,
          cached: false,
          queryId: `id${i}`,
          model: "gpt-4o" as const,
          searchedAt: new Date().toISOString(),
        },
        createdAt: new Date(),
      });
    }
    await store.put({
      keyword: "new",
      store: "s.com",
      result: {
        results: [],
        userRank: null,
        cached: false,
        queryId: "newid",
        model: "gpt-4o" as const,
        searchedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    });
    const found = await store.get("k0", "s.com");
    expect(found).toBeNull();
    const newest = await store.get("new", "s.com");
    expect(newest?.result.queryId).toBe("newid");
  });
});
