import type { VisibilityRecord, QueryStore } from "./types.js";
import { cacheKey } from "../lib/normalize.js";

const MAX_ENTRIES = 500;
const TTL_MS = 30 * 60 * 1000;

export function createMemoryStore(): QueryStore {
  const map = new Map<string, VisibilityRecord>();

  return {
    async get(keyword: string, store: string): Promise<VisibilityRecord | null> {
      const k = cacheKey(keyword, store);
      const record = map.get(k);
      if (!record) return null;
      if (Date.now() - record.createdAt.getTime() > TTL_MS) {
        map.delete(k);
        return null;
      }
      return record;
    },

    async put(record: VisibilityRecord): Promise<void> {
      const k = cacheKey(record.keyword, record.store);
      if (map.size >= MAX_ENTRIES && !map.has(k)) {
        const oldestKey = map.keys().next().value;
        if (oldestKey) map.delete(oldestKey);
      }
      map.set(k, record);
    },
  };
}
