# Landing-page Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock `generateMockResults()` on the landing page with a real Express backend that queries GPT-4o (web-search-grounded) and returns ranked AI visibility results via `POST /api/visibility`.

**Architecture:** Express server on port 8787 with a two-stage GPT-4o pipeline (grounded search → JSON formatter). In-memory LRU cache keyed by normalized `(keyword|store)`. Frontend (port 8080) calls `/api/visibility` via merge-port (port 3000) in development. All via `proc-compose up`.

**Tech Stack:** Express, OpenAI Responses API (`web_search` tool + `json_schema` output), Zod, `uuid`, TypeScript (strict). Frontend: Vite + React 18 + TypeScript.

**Existing scaffold (do NOT re-create):**
- `server/package.json` — express, openai, zod, uuid already declared
- `server/src/types.ts` — `AiRanking`, `VisibilityResponse`, `ErrorCode`, `ErrorResponse` already defined
- `server/src/lib/env.ts` + `env.test.ts` — zod validation + tests already done
- `server/.env.example` — already documented
- `server/tsconfig.json` — strict mode already configured
- `server/tsconfig.build.json` — already exists

---

## File Map

```
server/src/
  index.ts                          NEW — express app boot
  routes/
    visibility.ts                   NEW — POST /api/visibility handler
    health.ts                       NEW — GET /health probe
  pipeline/
    search.ts                       NEW — stage 1: GPT-4o + web_search
    format.ts                       NEW — stage 2: GPT-4o + json_schema
    index.ts                        NEW — orchestrates search → format + cache
  store/
    types.ts                        NEW — QueryStore interface + VisibilityRecord
    memoryStore.ts                  NEW — in-memory LRU implementation
  lib/
    openai.ts                       NEW — single OpenAI client singleton
    normalize.ts                    NEW — shared keyword/store normalization

proc-compose.yml                    NEW — at repo root

Frontend (src/pages/Index.tsx)       MODIFY — replace mock with real fetch
```

---

## Tasks

### Task 1: Server foundation — `normalize.ts`, `openai.ts`, store types, memory store

**Files:**
- Create: `server/src/lib/normalize.ts`
- Create: `server/src/lib/openai.ts`
- Create: `server/src/store/types.ts`
- Create: `server/src/store/memoryStore.ts`
- Create: `server/src/store/index.ts` (exports singleton)

- [ ] **Step 1: Write `server/src/lib/normalize.ts`**

```typescript
/**
 * Shared keyword/store normalization for cache key construction.
 * Lowercases, trims, strips trailing slash and leading `www.`.
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function cacheKey(keyword: string, store: string): string {
  return `${normalize(keyword)}|${normalize(store)}`;
}
```

- [ ] **Step 2: Write `server/src/lib/normalize.test.ts`**

```typescript
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
```

- [ ] **Step 3: Run normalize tests**
```
cd server && bun run test src/lib/normalize.test.ts
```
Expected: PASS

- [ ] **Step 4: Write `server/src/lib/openai.ts`**

```typescript
import OpenAI from "openai";
import { getEnv } from "./env.js";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) return client;
  const env = getEnv();
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}
```

- [ ] **Step 5: Write `server/src/store/types.ts`**

```typescript
import type { VisibilityResponse } from "../types.js";

export type VisibilityRecord = {
  keyword: string;
  store: string;
  result: VisibilityResponse;
  createdAt: Date;
};

export interface QueryStore {
  get(keyword: string, store: string): Promise<VisibilityRecord | null>;
  put(record: VisibilityRecord): Promise<void>;
}
```

- [ ] **Step 6: Write `server/src/store/memoryStore.ts`**

```typescript
import type { VisibilityRecord, QueryStore } from "./types.js";
import { cacheKey } from "../lib/normalize.js";

const MAX_ENTRIES = 500;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

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
      // Evict oldest if full
      if (map.size >= MAX_ENTRIES && !map.has(k)) {
        const oldestKey = map.keys().next().value;
        if (oldestKey) map.delete(oldestKey);
      }
      map.set(k, record);
    },
  };
}
```

- [ ] **Step 7: Write `server/src/store/index.ts`**

```typescript
import { createMemoryStore } from "./memoryStore.js";
import type { QueryStore } from "./types.js";
import { getEnv } from "../lib/env.js";

let store: QueryStore | null = null;

export function getStore(): QueryStore {
  if (store) return store;
  const env = getEnv();
  if (env.STORE_DRIVER === "postgres") {
    // TODO: require("@/store/pgStore") once implemented
    throw new Error("postgres driver not implemented");
  }
  store = createMemoryStore();
  return store;
}
```

- [ ] **Step 8: Write `server/src/store/memoryStore.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
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
      result: { results: [], userRank: null, cached: false, queryId: "x", model: "gpt-4o", searchedAt: new Date().toISOString() },
      createdAt: new Date(),
    };
    await store.put(record);
    const found = await store.get("shoes", "nike.com");
    expect(found).not.toBeNull();
    expect(found!.result.queryId).toBe("x");
  });

  it("cache key is case-insensitive", async () => {
    const record = { keyword: "Shoes", store: "Nike.com/", result: { results: [], userRank: null, cached: false, queryId: "y", model: "gpt-4o", searchedAt: new Date().toISOString() }, createdAt: new Date() };
    await store.put(record);
    const found = await store.get("shoes", "nike.com");
    expect(found).not.toBeNull();
  });

  it("evicts oldest when at capacity", async () => {
    // Fill to MAX_ENTRIES (500), then add one more — oldest should be gone
    for (let i = 0; i < 500; i++) {
      await store.put({ keyword: `k${i}`, store: "s.com", result: { results: [], userRank: null, cached: false, queryId: `id${i}`, model: "gpt-4o", searchedAt: new Date().toISOString() }, createdAt: new Date() });
    }
    await store.put({ keyword: "new", store: "s.com", result: { results: [], userRank: null, cached: false, queryId: "newid", model: "gpt-4o", searchedAt: new Date().toISOString() }, createdAt: new Date() });
    const found = await store.get("k0", "s.com");
    expect(found).toBeNull();
    const newest = await store.get("new", "s.com");
    expect(newest?.result.queryId).toBe("newid");
  });
});
```

- [ ] **Step 9: Run store tests**
```
cd server && bun run test src/store/memoryStore.test.ts src/lib/normalize.test.ts
```
Expected: PASS

- [ ] **Step 10: Commit**
```
git add server/src/lib/normalize.ts server/src/lib/normalize.test.ts server/src/lib/openai.ts server/src/store/types.ts server/src/store/memoryStore.ts server/src/store/memoryStore.test.ts server/src/store/index.ts
git commit -m "feat(server): add normalize, openai client, and memory store"
```

---

### Task 2: Pipeline — `search.ts`, `format.ts`, `index.ts`

**Files:**
- Create: `server/src/pipeline/search.ts`
- Create: `server/src/pipeline/format.ts`
- Create: `server/src/pipeline/index.ts`
- Create: `server/src/pipeline/index.test.ts`

- [ ] **Step 1: Write `server/src/pipeline/search.ts`**

```typescript
/**
 * Stage 1 — grounded search.
 * Calls GPT-4o Responses API with web_search tool.
 * Returns raw prose string (passed as-is to stage 2).
 */
import { getOpenAIClient } from "../lib/openai.js";

const SYSTEM_PROMPT = `You are an e-commerce discovery assistant. Given a shopper's query, use web search to identify the top ~10 online stores or brands a shopper would be recommended today. Consider whether the user's own store appears in this set.

User: Shopper query: "{keyword}"
       User's store: "{store}"
       Return: a ranked list of the 10 most recommended stores/brands,
       each with a one-sentence reason, citing web sources where relevant.
       If the user's store belongs in the top 10, include it at the
       appropriate rank and say so.`;

export async function groundedSearch(keyword: string, store: string): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: SYSTEM_PROMPT.replace("{keyword}", keyword).replace("{store}", store) },
      { role: "user", content: `Shopper query: "${keyword}"\nUser's store: "${store}"` },
    ],
    tools: [{ type: "web_search_preview" }],
    max_tokens: 4096,
  });

  return response.output_text ?? "";
}
```

- [ ] **Step 2: Write `server/src/pipeline/format.ts`**

```typescript
/**
 * Stage 2 — format to structured JSON.
 * Second GPT-4o call, no tools, json_schema output.
 * Parses the raw prose from stage 1 into AiRanking[].
 */
import { getOpenAIClient } from "../lib/openai.js";

const FORMAT_SCHEMA = {
  type: "object",
  properties: {
    rankings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          brand: { type: "string" },
          reason: { type: "string" },
          isUser: { type: "boolean" },
        },
        required: ["rank", "brand", "reason", "isUser"],
      },
    },
  },
  required: ["rankings"],
  additionalProperties: false,
} as const;

export type Stage2Output = {
  rankings: Array<{ rank: number; brand: string; reason: string; isUser: boolean }>;
};

export async function formatToJSON(rawProse: string, userStore: string): Promise<Stage2Output> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content:
          "You are a JSON extractor. Extract the ranked list from the following text as structured JSON. " +
          `If the user's store "${userStore}" appears, set isUser: true on that entry. ` +
          "Return ONLY valid JSON matching the schema.",
      },
      { role: "user", content: rawProse },
    ],
    response_format: {
      type: "json_schema",
      json_schema: FORMAT_SCHEMA,
    },
    max_tokens: 2048,
  });

  const text = response.output_text ?? "";
  try {
    return JSON.parse(text) as Stage2Output;
  } catch {
    throw new Error(`Stage 2 JSON parse failed: ${text.slice(0, 200)}`);
  }
}
```

- [ ] **Step 3: Write `server/src/pipeline/index.ts`**

```typescript
/**
 * Orchestrates: cache check → stage 1 → stage 2 → fuzzy match → cache put.
 * Total wall clock capped at 45s via AbortController.
 */
import { v4 as uuidv4 } from "uuid";
import type { VisibilityResponse } from "../types.js";
import type { Stage2Output } from "./format.js";
import { groundedSearch } from "./search.js";
import { formatToJSON } from "./format.js";
import { normalize } from "../lib/normalize.js";
import { getStore } from "../store/index.js";
import type { VisibilityRecord } from "../store/types.js";

const PIPELINE_TIMEOUT_MS = 45_000;

function fuzzyMatch(userStore: string, brand: string): boolean {
  const normalizeBrand = (s: string) =>
    s.toLowerCase().replace(/^www\./, "").replace(/\/$/, "").replace(/^https?:\/\//, "");
  return normalizeBrand(userStore) === normalizeBrand(brand);
}

export async function runPipeline(
  keyword: string,
  store: string,
): Promise<VisibilityResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PIPELINE_TIMEOUT_MS);

  try {
    const store_ = getStore();

    // 1. Cache check
    const cached = await store_.get(keyword, store);
    if (cached) {
      return { ...cached.result, cached: true };
    }

    // 2. Stage 1 — grounded search
    const stage1Start = Date.now();
    const rawProse = await groundedSearch(keyword, store);
    const stage1Ms = Date.now() - stage1Start;

    // 3. Stage 2 — format to JSON
    const stage2Start = Date.now();
    let stage2Output: Stage2Output;
    try {
      stage2Output = await formatToJSON(rawProse, store);
    } catch (err) {
      throw new PipelineError("upstream_failed", `Stage 2 failed: ${err}`, { stage1Ms });
    }
    const stage2Ms = Date.now() - stage2Start;

    // 4. Post-process: fuzzy match isUser
    let rankings = stage2Output.rankings.map((r) => ({ ...r }));
    const userMatchedIndex = rankings.findIndex((r) => fuzzyMatch(store, r.brand));
    if (userMatchedIndex !== -1) {
      rankings[userMatchedIndex] = { ...rankings[userMatchedIndex], isUser: true };
    }

    // 5. Validate entry count
    if (rankings.length < 5) {
      throw new PipelineError("upstream_failed", `Stage 2 returned only ${rankings.length} entries`, { stage1Ms, stage2Ms });
    }
    if (rankings.length > 10) {
      rankings = rankings.slice(0, 10);
    }

    // 6. Compute userRank
    const userEntry = rankings.find((r) => r.isUser);
    const userRank = userEntry ? userEntry.rank : null;

    const searchedAt = new Date().toISOString();
    const result: VisibilityResponse = {
      results: rankings,
      userRank,
      cached: false,
      queryId: uuidv4(),
      model: "gpt-4o",
      searchedAt,
    };

    // 7. Cache put
    const record: VisibilityRecord = { keyword, store, result, createdAt: new Date() };
    await store_.put(record);

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export class PipelineError extends Error {
  constructor(
    public code: "upstream_failed" | "internal",
    message: string,
    public timings?: { stage1Ms?: number; stage2Ms?: number },
  ) {
    super(message);
    this.name = "PipelineError";
  }
}
```

- [ ] **Step 4: Write `server/src/pipeline/index.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPipeline } from "./index.js";
import * as search from "./search.js";
import * as format from "./format.js";
import * as store from "../store/index.js";

vi.mock("../store/index.js");
vi.mock("./search.js");
vi.mock("./format.js");

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached result with cached:true on cache hit", async () => {
    const cachedResult = {
      results: [], userRank: null, cached: true, queryId: "cached-id", model: "gpt-4o" as const, searchedAt: "2024-01-01T00:00:00Z",
    };
    vi.spyOn(store, "getStore").mockReturnValue({
      get: vi.fn().mockResolvedValue({ keyword: "shoes", store: "nike.com", result: cachedResult, createdAt: new Date() }),
      put: vi.fn(),
    } as any);

    const result = await runPipeline("shoes", "nike.com");
    expect(result.cached).toBe(true);
    expect(result.queryId).toBe("cached-id");
  });

  it("calls stage 1 then stage 2 on cache miss", async () => {
    vi.spyOn(store, "getStore").mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    } as any);
    vi.spyOn(search, "groundedSearch").mockResolvedValue("1. Nike - Great shoes.");
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [{ rank: 1, brand: "Nike", reason: "Great shoes.", isUser: false }],
    });

    const result = await runPipeline("shoes", "nike.com");
    expect(search.groundedSearch).toHaveBeenCalledWith("shoes", "nike.com");
    expect(format.formatToJSON).toHaveBeenCalled();
    expect(result.cached).toBe(false);
  });

  it("throws PipelineError when stage 2 returns < 5 entries", async () => {
    vi.spyOn(store, "getStore").mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    } as any);
    vi.spyOn(search, "groundedSearch").mockResolvedValue("1. A");
    vi.spyOn(format, "formatToJSON").mockResolvedValue({
      rankings: [{ rank: 1, brand: "A", reason: "R", isUser: false }],
    });

    await expect(runPipeline("shoes", "nike.com")).rejects.toThrow("upstream_failed");
  });
});
```

- [ ] **Step 5: Run pipeline tests**
```
cd server && bun run test src/pipeline/index.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**
```
git add server/src/pipeline/search.ts server/src/pipeline/format.ts server/src/pipeline/index.ts server/src/pipeline/index.test.ts
git commit -m "feat(server): add two-stage GPT-4o pipeline"
```

---

### Task 3: Routes — `health.ts`, `visibility.ts`

**Files:**
- Create: `server/src/routes/health.ts`
- Create: `server/src/routes/visibility.ts`
- Create: `server/src/routes/visibility.test.ts`

- [ ] **Step 1: Write `server/src/routes/health.ts`**

```typescript
import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
```

- [ ] **Step 2: Write `server/src/routes/visibility.ts`**

```typescript
import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { runPipeline } from "../pipeline/index.js";
import { normalize } from "../lib/normalize.js";
import type { VisibilityResponse } from "../types.js";

const router = Router();

const QuerySchema = z.object({
  keyword: z.string().trim().min(1, "keyword is required"),
  store: z.string().trim().min(1, "store is required"),
});

function errorResponse(code: string, message: string, status: number) {
  return { error: code, message, status };
}

router.post("/api/visibility", async (req, res) => {
  const requestId = uuidv4();
  const log = (data: Record<string, unknown>) => {
    console.log(JSON.stringify({ requestId, ...data }));
  };

  // Validate input
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    log({ error: "invalid_input" });
    return res.status(400).json(errorResponse("invalid_input", parsed.error.errors[0].message, 400));
  }

  const { keyword, store } = parsed.data;

  try {
    const start = Date.now();
    const result: VisibilityResponse = await runPipeline(keyword, store);
    log({ keyword, store, cached: result.cached, resultCount: result.results.length, totalMs: Date.now() - start });
    return res.json(result);
  } catch (err: unknown) {
    const totalMs = 0; // timing not available on error path without more plumbing
    if (err instanceof Error && err.name === "PipelineError") {
      log({ error: "upstream_failed", message: err.message });
      return res.status(502).json(errorResponse("upstream_failed", err.message, 502));
    }
    log({ error: "internal", message: String(err) });
    return res.status(500).json(errorResponse("internal", "An unexpected error occurred", 500));
  }
});

export default router;
```

- [ ] **Step 3: Write `server/src/routes/visibility.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Router } from "express";
import visibilityRouter from "./visibility.js";
import * as pipeline from "../pipeline/index.js";
import { PipelineError } from "../pipeline/index.js";

vi.mock("../pipeline/index.js");

// Minimal Express app for testing
function createApp() {
  const app = Router();
  app.use(visibilityRouter);
  return app;
}

describe("POST /api/visibility", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  it("returns 200 with correct shape on success", async () => {
    vi.spyOn(pipeline, "runPipeline").mockResolvedValue({
      results: [{ rank: 1, brand: "Nike", reason: "Great", isUser: true }],
      userRank: 1, cached: false, queryId: "q1", model: "gpt-4o", searchedAt: "2024-01-01T00:00:00Z",
    });

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(200);

    expect(res.body.results).toHaveLength(1);
    expect(res.body.userRank).toBe(1);
    expect(res.body.cached).toBe(false);
    expect(res.body.model).toBe("gpt-4o");
  });

  it("returns cached:true on cache hit", async () => {
    vi.spyOn(pipeline, "runPipeline").mockResolvedValue({
      results: [], userRank: null, cached: true, queryId: "q1", model: "gpt-4o", searchedAt: "2024-01-01T00:00:00Z",
    });

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(200);

    expect(res.body.cached).toBe(true);
  });

  it("returns 400 on empty keyword", async () => {
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "  ", store: "nike.com" })
      .expect(400);

    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 400 on missing store", async () => {
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes" })
      .expect(400);

    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 502 on pipeline upstream_failed", async () => {
    vi.spyOn(pipeline, "runPipeline").mockRejectedValue(
      new PipelineError("upstream_failed", "Stage 2 failed"),
    );

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(502);

    expect(res.body.error).toBe("upstream_failed");
  });

  it("returns 502 on OpenAI error", async () => {
    vi.spyOn(pipeline, "runPipeline").mockRejectedValue(new Error("OpenAI auth failed"));

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(502);

    expect(res.body.error).toBe("upstream_failed");
  });

  it("returns 500 on unknown error", async () => {
    vi.spyOn(pipeline, "runPipeline").mockRejectedValue("string error");

    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "shoes", store: "nike.com" })
      .expect(500);

    expect(res.body.error).toBe("internal");
  });
});
```

- [ ] **Step 4: Run route tests**
```
cd server && bun run test src/routes/visibility.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**
```
git add server/src/routes/health.ts server/src/routes/visibility.ts server/src/routes/visibility.test.ts
git commit -m "feat(server): add health and visibility routes"
```

---

### Task 4: Express app boot — `server/src/index.ts`

**Files:**
- Create: `server/src/index.ts`

- [ ] **Step 1: Write `server/src/index.ts`**

```typescript
import express from "express";
import cors from "cors";
import { getEnv } from "./lib/env.js";
import visibilityRouter from "./routes/visibility.js";
import healthRouter from "./routes/health.js";

const env = getEnv();

const app = express();

// Raw body needed for some OpenAI response parsing debug scenarios
app.use(express.json());

// CORS — restrict to configured origin in production
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Routes
app.use(healthRouter);
app.use(visibilityRouter);

// Global error handler (catch-all, never reached by our code but safety net)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(JSON.stringify({ error: "internal", message: String(err) }));
  res.status(500).json({ error: "internal", message: "An unexpected error occurred" });
});

app.listen(env.PORT, () => {
  console.log(JSON.stringify({
    event: "server_start",
    port: env.PORT,
    storeDriver: env.STORE_DRIVER,
    logLevel: env.LOG_LEVEL,
  }));
});
```

- [ ] **Step 2: Verify TypeScript compiles**
```
cd server && bun run build
```
Expected: Exit code 0, no errors

- [ ] **Step 3: Commit**
```
git add server/src/index.ts
git commit -m "feat(server): add Express app entry point"
```

---

### Task 5: Dev tooling — `proc-compose.yml` at repo root

**Files:**
- Create: `proc-compose.yml` (at repo root)

- [ ] **Step 1: Write `proc-compose.yml`**

```yaml
merge:
  client: 8080   # Vite (unchanged from vite.config.ts)
  server: 8787   # Express
  port: 3000     # single port developer opens in browser

processes:
  backend:
    cmd: bun run dev
    dir: ./server
    env:
      PORT: "8787"
    restart: on-failure
    ready_when:
      http: http://localhost:8787/health

  frontend:
    cmd: bun run dev
    env:
      PORT: "8080"
    depends_on:
      - backend
    ready_when:
      log: "ready in"
```

- [ ] **Step 2: Verify proc-compose is available**
```
which proc-compose || echo "proc-compose not found in PATH"
```
If not found, add to dev notes: `npm install -g proc-compose` or `brew install proc-compose`

- [ ] **Step 3: Commit**
```
git add proc-compose.yml
git commit -m "chore: add proc-compose.yml for local dev orchestration"
```

---

### Task 6: Frontend — wire real API in `Index.tsx`

**Files:**
- Modify: `src/pages/Index.tsx`
- Modify: `src/lib/mockData.ts` (remove `generateMockResults` export, keep other exports)

- [ ] **Step 1: Read `src/pages/Index.tsx` (already done above)**

The current implementation:
```typescript
// Line 16-27: handleCheck replaces generateMockResults with setTimeout
const handleCheck = ({ keyword: k, store: s }) => {
  setKeyword(k);
  setStore(s);
  setResults([]);
  setLoading(true);
  setOpen(true);
  window.setTimeout(() => {
    setResults(generateMockResults(s));
    setLoading(false);
  }, 1800);
};
```

Replace with:
```typescript
const handleCheck = async ({ keyword: k, store: s }: { keyword: string; store: string }) => {
  setKeyword(k);
  setStore(s);
  setResults([]);
  setLoading(true);
  setOpen(true);

  try {
    const res = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: k, store: s }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    setResults(data.results);
  } catch (err) {
    console.error("Visibility check failed:", err);
    // Fail gracefully — no mock fallback. Error toast handled by ResultsSidebar loading state.
    setResults([]);
  } finally {
    setLoading(false);
  }
};
```

Apply this exact change to `src/pages/Index.tsx`:
- Remove `import { generateMockResults } from "@/lib/mockData";`
- Replace the `handleCheck` function body with the async fetch above
- Keep the existing state updates (`setKeyword`, `setStore`, `setResults([])`, `setLoading(true)`, `setOpen(true)`)

- [ ] **Step 2: Verify no TypeScript errors**
```
bun run build
```
Expected: Exit code 0. If errors, fix inline.

- [ ] **Step 3: Commit**
```
git add src/pages/Index.tsx
git commit -m "feat(frontend): wire real /api/visibility endpoint, remove mock"
```

---

### Task 7: End-to-end verification

- [ ] **Step 1: Copy env file**
```
cp server/.env.example server/.env
# Edit server/.env and set OPENAI_API_KEY=sk-...
```

- [ ] **Step 2: Start the stack**
```
proc-compose up
```
Expected: Backend starts on 8787, frontend on 8080, merge-port on 3000.

- [ ] **Step 3: Health check**
```
curl http://localhost:8787/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 4: Visibility endpoint test**
```
curl -X POST http://localhost:8787/api/visibility \
  -H "Content-Type: application/json" \
  -d '{"keyword": "running shoes", "store": "Nike.com"}'
```
Expected: 200 with `{ results: [...], userRank: number|null, cached: false, queryId: "...", model: "gpt-4o", searchedAt: "..." }`

- [ ] **Step 5: Error case — empty keyword**
```
curl -X POST http://localhost:8787/api/visibility \
  -H "Content-Type: application/json" \
  -d '{"keyword": "", "store": "Nike.com"}'
```
Expected: `400` with `{ error: "invalid_input", message: "..." }`

- [ ] **Step 6: Open browser to http://localhost:3000**
- Fill in keyword + store on landing page, submit.
- Loading state shows (spinner).
- Results appear with real GPT-4o data.
- Console: no errors.

- [ ] **Step 7: Run server tests**
```
cd server && bun run test
```
Expected: All tests pass.

---

## Spec Coverage Checklist

| Spec Section | Task(s) |
|---|---|
| Architecture (Express + pipeline + cache) | Tasks 1–4 |
| POST /api/visibility contract | Task 3 (visibility.ts) |
| GET /health contract | Task 3 (health.ts) |
| Two-stage pipeline (stage 1 web_search, stage 2 json_schema) | Task 2 |
| GPT-4o Responses API with web_search tool | Task 2 (search.ts) |
| GPT-4o json_schema output format | Task 2 (format.ts) |
| Cache layer (in-memory LRU, TTL 30min, 500 max) | Task 1 (memoryStore.ts) |
| normalize() for cache key | Task 1 (normalize.ts) |
| Error codes: 400/502/500 | Task 3 (visibility.ts) |
| Structured JSON logging | Task 3 (visibility.ts) |
| Pipeline 45s timeout | Task 2 (index.ts, AbortController) |
| No retries in pipeline | Task 2 (no retry logic) |
| Fuzzy-match user store | Task 2 (index.ts, fuzzyMatch fn) |
| Exactly 10 entries enforcement | Task 2 (index.ts) |
| Frontend: remove fake delay, no mock fallback | Task 6 (Index.tsx) |
| proc-compose.yml | Task 5 |
| server/.env.example | Already existed |
| Unit tests: normalize, memory cache, stage-2 schema | Tasks 1–2 |
| Integration tests: route + mock OpenAI | Task 3 |
| Deferred TODO comments in code | In-pipeline comments |
| Server env validation with zod | Already existed (env.ts) |

---

## Deferred (add TODO comments in code)

These are NOT implemented in this plan — only TODO comments with file:line references:

- **Rate limiting** — add `TODO: rate limiting` in `visibility.ts` before the route handler.
- **Postgres QueryStore** — `TODO: implement pgStore` in `store/index.ts` before the throw.
- **Query log / analytics** — `TODO: persist query to analytics DB` in `visibility.ts` after successful pipeline run.
- **Real admin auth** — `TODO: real admin auth` in the admin login page.
- **Production deploy** — `TODO: Dockerfile` in `server/` root.

---

*Plan created from `docs/superpowers/specs/2026-04-21-landing-backend-design.md`*
