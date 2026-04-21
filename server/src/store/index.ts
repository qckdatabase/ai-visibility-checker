import { createMemoryStore } from "./memoryStore.js";
import { createPgStore } from "../db/pgStore.js";
import type { QueryStore } from "./types.js";
import { getEnv } from "../lib/env.js";

let store: QueryStore;

export function getStore(): QueryStore {
  const env = getEnv();
  if (env.STORE_DRIVER === "postgres") {
    store = createPgStore();
  } else {
    store = createMemoryStore();
  }
  return store;
}
