import { createMemoryStore } from "./memoryStore.js";
import type { QueryStore } from "./types.js";
import { getEnv } from "../lib/env.js";

let store: QueryStore | null = null;

export function getStore(): QueryStore {
  if (store) return store;
  const env = getEnv();
  if (env.STORE_DRIVER === "postgres") {
    // TODO: implement pgStore
    throw new Error("postgres driver not implemented");
  }
  store = createMemoryStore();
  return store;
}
