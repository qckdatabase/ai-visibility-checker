# Landing-page backend implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's `generateMockResults()` with a real Express backend that queries GPT-4o (web-search grounded), reformats the output into structured JSON, and returns the top-10 ranked stores with the user's store flagged if present.

**Architecture:** An Express server under `server/` (separate package) exposing `POST /api/visibility` and `GET /health`. The visibility route runs a two-stage GPT-4o pipeline (grounded search → JSON formatter), normalizes the result, flags the user's store via fuzzy matching, and caches by `(keyword, store)` in an in-memory LRU with 30-min TTL behind a `QueryStore` interface (so a Postgres driver can drop in later). `proc-compose` runs Vite + Express + `merge-port` under one terminal on port `3000`.

**Tech Stack:** Node 20+, TypeScript 5, Express 4, zod (input + env validation), official `openai` v4 SDK, `tsx` for dev watch, Vitest for tests, `uuid` for request IDs. Frontend stays on Vite + React 18 + TanStack Query-less `fetch` (no new deps on the client side; `sonner` is already installed for toasts).

**Spec:** `docs/superpowers/specs/2026-04-21-landing-backend-design.md`

---

## File map

**Create:**
- `server/package.json` — server deps + scripts
- `server/tsconfig.json` — TS config (strict, NodeNext)
- `server/vitest.config.ts` — Vitest config, Node env
- `server/.env.example` — documented env vars
- `server/.gitignore` — local `.env`, `dist/`, `node_modules/`
- `server/src/index.ts` — Express app boot
- `server/src/types.ts` — shared response + error types
- `server/src/lib/env.ts` — zod-validated env loader
- `server/src/lib/env.test.ts`
- `server/src/lib/normalize.ts` — keyword/store normalization + fuzzy match helper
- `server/src/lib/normalize.test.ts`
- `server/src/lib/openai.ts` — singleton OpenAI client
- `server/src/store/types.ts` — `QueryStore` interface + `VisibilityRecord`
- `server/src/store/memoryStore.ts` — in-memory LRU + TTL impl
- `server/src/store/memoryStore.test.ts`
- `server/src/routes/health.ts` — `GET /health`
- `server/src/routes/visibility.ts` — `POST /api/visibility`
- `server/src/routes/visibility.test.ts` — integration test (mocked OpenAI)
- `server/src/pipeline/search.ts` — GPT-4o web-search call
- `server/src/pipeline/format.ts` — GPT-4o JSON formatter
- `server/src/pipeline/index.ts` — orchestrator
- `server/src/pipeline/index.test.ts` — orchestrator unit tests
- `proc-compose.yml` — repo-root process config

**Modify:**
- `src/pages/Index.tsx` — call real API, remove fake setTimeout, show error toast

---

## Task 1: Scaffold `server/` package

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/vitest.config.ts`
- Create: `server/.env.example`
- Create: `server/.gitignore`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "qck-server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "openai": "^4.77.0",
    "uuid": "^10.0.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.16.5",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 3: Create `server/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```

- [ ] **Step 4: Create `server/.env.example`**

```
# Required
OPENAI_API_KEY=sk-replace-me

# Optional — defaults shown
PORT=8787
CORS_ORIGIN=http://localhost:3000
STORE_DRIVER=memory
LOG_LEVEL=info
```

- [ ] **Step 5: Create `server/.gitignore`**

```
node_modules
dist
.env
.env.local
*.log
```

- [ ] **Step 6: Install deps**

Run: `cd server && bun install`
Expected: `bun.lock` (or `package-lock.json`) appears in `server/`, no errors.

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/tsconfig.json server/vitest.config.ts \
        server/.env.example server/.gitignore \
        server/bun.lock server/bun.lockb server/package-lock.json 2>/dev/null
git commit -m "chore(server): scaffold server package"
```

(Only the lockfile(s) that actually got generated need to be added — ignore missing ones.)

---

## Task 2: Shared server types

**Files:**
- Create: `server/src/types.ts`

- [ ] **Step 1: Create `server/src/types.ts`**

```ts
// Canonical shape returned inside `results[]`. Mirrors the frontend's
// AiRanking type defined in src/components/landing/ResultsSidebar.tsx.
// Do NOT diverge from that shape without updating the frontend too.
export type AiRanking = {
  rank: number;
  brand: string;
  reason: string;
  isUser: boolean;
};

export type VisibilityResponse = {
  results: AiRanking[];    // exactly 10 entries
  userRank: number | null; // rank of user's store if found, else null
  cached: boolean;
  queryId: string;
  model: "gpt-4o";
  searchedAt: string;      // ISO timestamp
};

export type ErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "upstream_failed"
  | "internal";

export type ErrorResponse = {
  error: ErrorCode;
  message: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/types.ts
git commit -m "feat(server): add shared response and error types"
```

---

## Task 3: Env loader with zod validation

**Files:**
- Create: `server/src/lib/env.ts`
- Test: `server/src/lib/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// server/src/lib/env.test.ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "./env.js";

describe("parseEnv", () => {
  it("parses a valid env and applies defaults", () => {
    const env = parseEnv({ OPENAI_API_KEY: "sk-test" });
    expect(env.OPENAI_API_KEY).toBe("sk-test");
    expect(env.PORT).toBe(8787);
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
    expect(env.STORE_DRIVER).toBe("memory");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("throws when OPENAI_API_KEY is missing", () => {
    expect(() => parseEnv({})).toThrow(/OPENAI_API_KEY/);
  });

  it("coerces PORT to a number", () => {
    const env = parseEnv({ OPENAI_API_KEY: "sk-test", PORT: "9000" });
    expect(env.PORT).toBe(9000);
  });

  it("rejects unknown STORE_DRIVER values", () => {
    expect(() =>
      parseEnv({ OPENAI_API_KEY: "sk-test", STORE_DRIVER: "mongodb" }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bun run test src/lib/env.test.ts`
Expected: FAIL — `env.js` does not exist.

- [ ] **Step 3: Create `server/src/lib/env.ts`**

```ts
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  STORE_DRIVER: z.enum(["memory", "postgres"]).default("memory"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}

// Lazily-loaded singleton for production use (index.ts calls getEnv()).
let cached: Env | null = null;
export function getEnv(): Env {
  if (cached) return cached;
  cached = parseEnv(process.env);
  return cached;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && bun run test src/lib/env.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/env.ts server/src/lib/env.test.ts
git commit -m "feat(server): add zod-validated env loader"
```

---

## Task 4: Normalize utility + fuzzy match

**Files:**
- Create: `server/src/lib/normalize.ts`
- Test: `server/src/lib/normalize.test.ts`

The spec requires: lowercase, trim, strip trailing slash, strip leading `www.`, and compare domain roots. This utility powers both the cache key and the user-store fuzzy match in the pipeline post-processing.

- [ ] **Step 1: Write the failing test**

```ts
// server/src/lib/normalize.test.ts
import { describe, it, expect } from "vitest";
import { normalize, cacheKey, storeMatches } from "./normalize.js";

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  Example.com  ")).toBe("example.com");
  });
  it("strips leading www.", () => {
    expect(normalize("www.example.com")).toBe("example.com");
  });
  it("strips trailing slash", () => {
    expect(normalize("example.com/")).toBe("example.com");
  });
  it("strips scheme", () => {
    expect(normalize("https://example.com")).toBe("example.com");
    expect(normalize("http://www.Example.com/")).toBe("example.com");
  });
  it("leaves regular text untouched aside from casing", () => {
    expect(normalize("Glow & Co.")).toBe("glow & co.");
  });
});

describe("cacheKey", () => {
  it("joins normalized keyword and store", () => {
    expect(cacheKey("Best Shoes", "www.Store.com/")).toBe(
      "best shoes|store.com",
    );
  });
  it("treats trivially different inputs as the same key", () => {
    expect(cacheKey("Best Shoes ", "https://store.com")).toBe(
      cacheKey("best shoes", "www.store.com/"),
    );
  });
});

describe("storeMatches", () => {
  it("matches identical domains", () => {
    expect(storeMatches("example.com", "Example.com")).toBe(true);
  });
  it("matches when one side is the brand name and the other is the domain root", () => {
    expect(storeMatches("Glow & Co.", "glowandco.com")).toBe(false);
    // Conservative: only domain-level matches count. Brand-name fuzziness
    // is left to the LLM's own isUser flag.
  });
  it("matches www/no-www and scheme variants", () => {
    expect(storeMatches("https://www.example.com/", "example.com")).toBe(true);
  });
  it("matches when one side is a bare brand that equals the domain base", () => {
    expect(storeMatches("example", "example.com")).toBe(true);
    expect(storeMatches("Example Store", "example.com")).toBe(false);
  });
  it("does not match unrelated strings", () => {
    expect(storeMatches("foo.com", "bar.com")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bun run test src/lib/normalize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `server/src/lib/normalize.ts`**

```ts
// Normalize a keyword or store string for cache keys and fuzzy comparison.
// Rules: lowercase, trim, drop scheme (http/https), drop leading "www.",
// drop a single trailing slash.
export function normalize(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.replace(/\/+$/, "");
  return s;
}

export function cacheKey(keyword: string, store: string): string {
  return `${normalize(keyword)}|${normalize(store)}`;
}

// Returns true if two store references plausibly point at the same store.
// Conservative: we only match at the domain level, not on brand-name
// similarity — that's what the LLM's own isUser flag (and stage 2) is for.
export function storeMatches(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // If one side has a TLD and the other is a bare name, compare the
  // domain's leftmost label to the bare name.
  const rootA = na.split(".")[0];
  const rootB = nb.split(".")[0];
  const aIsDomain = na.includes(".");
  const bIsDomain = nb.includes(".");
  if (aIsDomain && !bIsDomain) return rootA === nb;
  if (!aIsDomain && bIsDomain) return rootB === na;
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && bun run test src/lib/normalize.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/normalize.ts server/src/lib/normalize.test.ts
git commit -m "feat(server): add normalize + fuzzy store-match helpers"
```

---

## Task 5: OpenAI client singleton

**Files:**
- Create: `server/src/lib/openai.ts`

This is a thin wrapper — no tests needed. It exists so the pipeline modules can import one client instance and so tests can `vi.mock("../lib/openai.js")` at one location.

- [ ] **Step 1: Create `server/src/lib/openai.ts`**

```ts
import OpenAI from "openai";
import { getEnv } from "./env.js";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (client) return client;
  client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  return client;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/openai.ts
git commit -m "feat(server): add OpenAI client singleton"
```

---

## Task 6: QueryStore interface + in-memory implementation

**Files:**
- Create: `server/src/store/types.ts`
- Create: `server/src/store/memoryStore.ts`
- Test: `server/src/store/memoryStore.test.ts`

- [ ] **Step 1: Create the interface (`server/src/store/types.ts`)**

```ts
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

- [ ] **Step 2: Write the failing test (`server/src/store/memoryStore.test.ts`)**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MemoryStore } from "./memoryStore.js";
import type { VisibilityResponse } from "../types.js";

const sampleResult = (queryId = "q1"): VisibilityResponse => ({
  results: [],
  userRank: null,
  cached: false,
  queryId,
  model: "gpt-4o",
  searchedAt: new Date().toISOString(),
});

describe("MemoryStore", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stores and retrieves by normalized keyword+store", async () => {
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    await store.put({
      keyword: "Best Shoes",
      store: "www.Store.com/",
      result: sampleResult("q1"),
      createdAt: new Date(),
    });
    const hit = await store.get("best shoes", "store.com");
    expect(hit?.result.queryId).toBe("q1");
  });

  it("returns null when nothing is stored", async () => {
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    expect(await store.get("nope", "nowhere")).toBeNull();
  });

  it("expires entries after ttl", async () => {
    const store = new MemoryStore({ ttlMs: 1000, maxEntries: 10 });
    await store.put({
      keyword: "k",
      store: "s.com",
      result: sampleResult(),
      createdAt: new Date(),
    });
    expect(await store.get("k", "s.com")).not.toBeNull();
    vi.advanceTimersByTime(1500);
    expect(await store.get("k", "s.com")).toBeNull();
  });

  it("evicts oldest when over maxEntries", async () => {
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 2 });
    await store.put({ keyword: "a", store: "s.com", result: sampleResult("a"), createdAt: new Date() });
    await store.put({ keyword: "b", store: "s.com", result: sampleResult("b"), createdAt: new Date() });
    await store.put({ keyword: "c", store: "s.com", result: sampleResult("c"), createdAt: new Date() });
    expect(await store.get("a", "s.com")).toBeNull();
    expect((await store.get("b", "s.com"))?.result.queryId).toBe("b");
    expect((await store.get("c", "s.com"))?.result.queryId).toBe("c");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && bun run test src/store/memoryStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `server/src/store/memoryStore.ts`**

```ts
import { cacheKey } from "../lib/normalize.js";
import type { QueryStore, VisibilityRecord } from "./types.js";

type Entry = { record: VisibilityRecord; expiresAt: number };

export type MemoryStoreOptions = {
  ttlMs: number;
  maxEntries: number;
};

export class MemoryStore implements QueryStore {
  private readonly entries = new Map<string, Entry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(opts: MemoryStoreOptions) {
    this.ttlMs = opts.ttlMs;
    this.maxEntries = opts.maxEntries;
  }

  async get(keyword: string, store: string): Promise<VisibilityRecord | null> {
    const key = cacheKey(keyword, store);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    // LRU touch: re-insert to move to end.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.record;
  }

  async put(record: VisibilityRecord): Promise<void> {
    const key = cacheKey(record.keyword, record.store);
    this.entries.delete(key);
    this.entries.set(key, {
      record,
      expiresAt: Date.now() + this.ttlMs,
    });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && bun run test src/store`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/store/types.ts server/src/store/memoryStore.ts server/src/store/memoryStore.test.ts
git commit -m "feat(server): add QueryStore interface and memory-backed LRU"
```

---

## Task 7: Health route + minimal Express bootstrap

**Files:**
- Create: `server/src/routes/health.ts`
- Create: `server/src/index.ts` (minimal — will be expanded in Task 12)

We need a booting Express app so subsequent pipeline/integration tests have a target. Express app factory goes in `index.ts` (exported `createApp()`); the actual `listen()` call goes inside a module-level guard so tests can import without binding a port.

- [ ] **Step 1: Create `server/src/routes/health.ts`**

```ts
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
```

- [ ] **Step 2: Create `server/src/index.ts` (minimal version)**

```ts
import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(healthRouter);
  return app;
}

// Only start listening when run directly, not when imported by tests.
const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/src/index.ts") ||
  process.argv[1]?.endsWith("/dist/index.js");

if (isEntry) {
  // Defer to avoid importing env.js at module-eval time in tests.
  const { getEnv } = await import("./lib/env.js");
  const env = getEnv();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT}`);
  });
}
```

- [ ] **Step 3: Verify the server boots**

Run (in one terminal):
```bash
cd server && OPENAI_API_KEY=sk-test bun run dev
```
Then in another terminal: `curl -s http://localhost:8787/health`
Expected: `{"status":"ok"}`
Stop the dev server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/health.ts server/src/index.ts
git commit -m "feat(server): add /health and bootstrap express app factory"
```

---

## Task 8: Pipeline stage 1 — grounded search

**Files:**
- Create: `server/src/pipeline/search.ts`

Stage 1 calls GPT-4o's Responses API with the `web_search_preview` tool enabled and returns the free-form response text. Testing this in isolation is low-value (we'd be asserting on a mock), so the real behavior gets exercised in Task 10's orchestrator tests and Task 11's route tests via mocked OpenAI.

> **Note on OpenAI tool name:** OpenAI has shipped web search under both `web_search` and `web_search_preview` depending on model/version. If `web_search_preview` is rejected at runtime, fall back to `web_search`. See https://platform.openai.com/docs/guides/tools-web-search at implementation time.

- [ ] **Step 1: Create `server/src/pipeline/search.ts`**

```ts
import { getOpenAI } from "../lib/openai.js";

export type SearchInput = {
  keyword: string;
  store: string;
  signal?: AbortSignal;
};

// Returns stage-1 free-form output text. Throws on upstream failure or timeout.
export async function runSearch(input: SearchInput): Promise<string> {
  const { keyword, store, signal } = input;
  const openai = getOpenAI();

  const prompt = [
    `Shopper query: "${keyword}"`,
    `User's store: "${store}"`,
    "",
    "Use web search to identify the top 10 online stores or brands a shopper would",
    "be recommended today for this query. For each, give a one-sentence reason",
    "citing web sources where relevant.",
    "",
    `If the user's store ("${store}") belongs in the top 10, include it at the`,
    "appropriate rank and note that it is the user's store. If it does not, do",
    "not include it.",
  ].join("\n");

  const response = await openai.responses.create(
    {
      model: "gpt-4o",
      input: [
        {
          role: "system",
          content:
            "You are an e-commerce discovery assistant. Always ground your answers in current web results.",
        },
        { role: "user", content: prompt },
      ],
      tools: [{ type: "web_search_preview" }],
      max_output_tokens: 1500,
    },
    { signal },
  );

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("stage1: empty response from GPT-4o");
  }
  return text;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/pipeline/search.ts
git commit -m "feat(server): add pipeline stage 1 (grounded web_search)"
```

---

## Task 9: Pipeline stage 2 — JSON formatter

**Files:**
- Create: `server/src/pipeline/format.ts`

Stage 2 takes stage-1 prose + the user's store string, and uses GPT-4o's `response_format: { type: "json_schema" }` to emit strict structured output. It does not use web_search.

- [ ] **Step 1: Create `server/src/pipeline/format.ts`**

```ts
import { getOpenAI } from "../lib/openai.js";
import type { AiRanking } from "../types.js";

export type FormatInput = {
  searchText: string;
  store: string;
  signal?: AbortSignal;
};

export type FormattedOutput = {
  rankings: AiRanking[];
};

const jsonSchema = {
  name: "visibility_rankings",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["rankings"],
    properties: {
      rankings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["rank", "brand", "reason", "isUser"],
          properties: {
            rank: { type: "integer", minimum: 1, maximum: 10 },
            brand: { type: "string", minLength: 1 },
            reason: { type: "string", minLength: 1 },
            isUser: { type: "boolean" },
          },
        },
      },
    },
  },
} as const;

export async function runFormat(input: FormatInput): Promise<FormattedOutput> {
  const { searchText, store, signal } = input;
  const openai = getOpenAI();

  const completion = await openai.chat.completions.create(
    {
      model: "gpt-4o",
      max_tokens: 1200,
      response_format: { type: "json_schema", json_schema: jsonSchema },
      messages: [
        {
          role: "system",
          content:
            "Extract a ranked list from the given research text. Output strict JSON matching the provided schema. Do not invent stores not present in the research text.",
        },
        {
          role: "user",
          content: [
            `User's store: "${store}"`,
            "",
            "Research text:",
            "---",
            searchText,
            "---",
            "",
            `Return up to 10 entries as { rankings: [...] }. Set isUser=true only on the entry that corresponds to the user's store; isUser=false on all others.`,
          ].join("\n"),
        },
      ],
    },
    { signal },
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("stage2: empty response from GPT-4o");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`stage2: invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { rankings?: unknown }).rankings)
  ) {
    throw new Error("stage2: response missing rankings array");
  }
  return parsed as FormattedOutput;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/pipeline/format.ts
git commit -m "feat(server): add pipeline stage 2 (json_schema formatter)"
```

---

## Task 10: Pipeline orchestrator + post-processing tests

**Files:**
- Create: `server/src/pipeline/index.ts`
- Test: `server/src/pipeline/index.test.ts`

The orchestrator calls search → format, then post-processes: fuzzy-match user's store, compute `userRank`, enforce exactly 10 entries (truncate if >10, raise if <5, pad with no-op if 5–9 is not wanted → actually the spec says log warning and return what we have; we'll truncate/accept 5–9 with a warning and only raise below 5). Post-processing is what we unit-test; search + format get mocked.

- [ ] **Step 1: Write the failing test (`server/src/pipeline/index.test.ts`)**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./search.js", () => ({ runSearch: vi.fn() }));
vi.mock("./format.js", () => ({ runFormat: vi.fn() }));

import { runSearch } from "./search.js";
import { runFormat } from "./format.js";
import { runVisibilityPipeline } from "./index.js";
import { MemoryStore } from "../store/memoryStore.js";

const mkRanking = (rank: number, brand: string, isUser = false) => ({
  rank,
  brand,
  reason: `reason ${rank}`,
  isUser,
});

describe("runVisibilityPipeline", () => {
  beforeEach(() => {
    vi.mocked(runSearch).mockReset();
    vi.mocked(runFormat).mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it("returns 10 results, computes userRank from stage-2 flag", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1 text");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: [
        mkRanking(1, "Acme"),
        mkRanking(2, "example.com", true),
        ...Array.from({ length: 8 }, (_, i) => mkRanking(i + 3, `brand${i + 3}`)),
      ],
    });

    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    const out = await runVisibilityPipeline({
      keyword: "best widgets",
      store: "example.com",
      cache: store,
    });

    expect(out.cached).toBe(false);
    expect(out.results).toHaveLength(10);
    expect(out.userRank).toBe(2);
    expect(out.results[1]?.isUser).toBe(true);
    expect(out.model).toBe("gpt-4o");
    expect(out.queryId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("applies fuzzy store-match when stage 2 missed it", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: Array.from({ length: 10 }, (_, i) =>
        mkRanking(i + 1, i === 4 ? "Example.com" : `brand${i + 1}`),
      ),
    });
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    const out = await runVisibilityPipeline({
      keyword: "k",
      store: "https://www.example.com/",
      cache: store,
    });
    expect(out.userRank).toBe(5);
    expect(out.results[4]?.isUser).toBe(true);
  });

  it("truncates to 10 when stage 2 returns more", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: Array.from({ length: 13 }, (_, i) => mkRanking(i + 1, `b${i}`)),
    });
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    const out = await runVisibilityPipeline({
      keyword: "k",
      store: "s.com",
      cache: store,
    });
    expect(out.results).toHaveLength(10);
  });

  it("throws when stage 2 returns fewer than 5 entries", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: [mkRanking(1, "only"), mkRanking(2, "two")],
    });
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    await expect(
      runVisibilityPipeline({ keyword: "k", store: "s.com", cache: store }),
    ).rejects.toThrow(/too few/i);
  });

  it("returns cached response with cached=true on repeat call", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: Array.from({ length: 10 }, (_, i) => mkRanking(i + 1, `b${i}`)),
    });
    const store = new MemoryStore({ ttlMs: 60_000, maxEntries: 10 });
    const first = await runVisibilityPipeline({
      keyword: "k",
      store: "s.com",
      cache: store,
    });
    const second = await runVisibilityPipeline({
      keyword: "K ",
      store: "s.com",
      cache: store,
    });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.queryId).toBe(first.queryId);
    expect(vi.mocked(runSearch)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runFormat)).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bun run test src/pipeline/index.test.ts`
Expected: FAIL — `runVisibilityPipeline` not found.

- [ ] **Step 3: Create `server/src/pipeline/index.ts`**

```ts
import { randomUUID } from "node:crypto";
import { runSearch } from "./search.js";
import { runFormat } from "./format.js";
import type { QueryStore } from "../store/types.js";
import type { AiRanking, VisibilityResponse } from "../types.js";
import { storeMatches } from "../lib/normalize.js";

export type PipelineInput = {
  keyword: string;
  store: string;
  cache: QueryStore;
  timeoutMs?: number; // default 45_000
};

const MIN_ENTRIES = 5;
const MAX_ENTRIES = 10;
const DEFAULT_TIMEOUT_MS = 45_000;

export async function runVisibilityPipeline(
  input: PipelineInput,
): Promise<VisibilityResponse> {
  const { keyword, store, cache } = input;
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const cached = await cache.get(keyword, store);
  if (cached) {
    return { ...cached.result, cached: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let formatted;
  try {
    const searchText = await runSearch({ keyword, store, signal: controller.signal });
    formatted = await runFormat({ searchText, store, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  let rankings = formatted.rankings;
  if (rankings.length > MAX_ENTRIES) {
    rankings = rankings.slice(0, MAX_ENTRIES);
  }
  if (rankings.length < MIN_ENTRIES) {
    throw new Error(
      `stage2: too few entries (${rankings.length}); expected at least ${MIN_ENTRIES}`,
    );
  }

  // Backstop fuzzy match in case stage 2 missed it.
  const adjusted: AiRanking[] = rankings.map((r) => {
    if (r.isUser) return r;
    return storeMatches(r.brand, store) ? { ...r, isUser: true } : r;
  });

  // Reassign ranks to 1..N in case stage 2 emitted non-sequential values.
  const normalized = adjusted.map((r, i) => ({ ...r, rank: i + 1 }));
  const userEntry = normalized.find((r) => r.isUser);
  const userRank = userEntry ? userEntry.rank : null;

  const response: VisibilityResponse = {
    results: normalized,
    userRank,
    cached: false,
    queryId: randomUUID(),
    model: "gpt-4o",
    searchedAt: new Date().toISOString(),
  };

  await cache.put({
    keyword,
    store,
    result: response,
    createdAt: new Date(),
  });

  return response;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && bun run test src/pipeline`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/pipeline/index.ts server/src/pipeline/index.test.ts
git commit -m "feat(server): add pipeline orchestrator with post-processing and cache"
```

---

## Task 11: Visibility route + integration tests

**Files:**
- Create: `server/src/routes/visibility.ts`
- Test: `server/src/routes/visibility.test.ts`

- [ ] **Step 1: Write the failing test (`server/src/routes/visibility.test.ts`)**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

vi.mock("../pipeline/search.js", () => ({ runSearch: vi.fn() }));
vi.mock("../pipeline/format.js", () => ({ runFormat: vi.fn() }));

import { runSearch } from "../pipeline/search.js";
import { runFormat } from "../pipeline/format.js";
import { createApp } from "../index.js";

const mkRanking = (rank: number, brand: string, isUser = false) => ({
  rank,
  brand,
  reason: `reason ${rank}`,
  isUser,
});

describe("POST /api/visibility", () => {
  beforeEach(() => {
    vi.mocked(runSearch).mockReset();
    vi.mocked(runFormat).mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it("returns 200 with results on happy path", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: Array.from({ length: 10 }, (_, i) =>
        mkRanking(i + 1, i === 3 ? "example.com" : `b${i}`, i === 3),
      ),
    });

    const app = createApp();
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "best shoes", store: "example.com" })
      .expect(200);

    expect(res.body.results).toHaveLength(10);
    expect(res.body.userRank).toBe(4);
    expect(res.body.cached).toBe(false);
    expect(res.body.model).toBe("gpt-4o");
  });

  it("caches repeat calls", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: Array.from({ length: 10 }, (_, i) => mkRanking(i + 1, `b${i}`)),
    });
    const app = createApp();
    await request(app).post("/api/visibility").send({ keyword: "k", store: "s.com" }).expect(200);
    const second = await request(app)
      .post("/api/visibility")
      .send({ keyword: "k", store: "s.com" })
      .expect(200);
    expect(second.body.cached).toBe(true);
    expect(vi.mocked(runSearch)).toHaveBeenCalledTimes(1);
  });

  it("returns 400 on empty keyword", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "   ", store: "s.com" })
      .expect(400);
    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 400 on missing store", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "k" })
      .expect(400);
    expect(res.body.error).toBe("invalid_input");
  });

  it("returns 502 when stage 1 throws", async () => {
    vi.mocked(runSearch).mockRejectedValue(new Error("boom"));
    const app = createApp();
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "k", store: "s.com" })
      .expect(502);
    expect(res.body.error).toBe("upstream_failed");
  });

  it("returns 502 when stage 2 returns too few entries", async () => {
    vi.mocked(runSearch).mockResolvedValue("stage1");
    vi.mocked(runFormat).mockResolvedValue({
      rankings: [mkRanking(1, "only")],
    });
    const app = createApp();
    const res = await request(app)
      .post("/api/visibility")
      .send({ keyword: "k", store: "s.com" })
      .expect(502);
    expect(res.body.error).toBe("upstream_failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bun run test src/routes/visibility.test.ts`
Expected: FAIL — route not wired yet.

- [ ] **Step 3: Create `server/src/routes/visibility.ts`**

```ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { runVisibilityPipeline } from "../pipeline/index.js";
import { MemoryStore } from "../store/memoryStore.js";
import type { QueryStore } from "../store/types.js";
import type { ErrorResponse } from "../types.js";

// TODO(landing-backend): add per-IP rate limiting (express-rate-limit)
// before making the endpoint public. Set a budget cap in the OpenAI
// dashboard as a belt-and-braces backstop. See
// docs/superpowers/specs/2026-04-21-landing-backend-design.md "Deferred".

const InputSchema = z.object({
  keyword: z.string().trim().min(1),
  store: z.string().trim().min(1),
});

// TODO(landing-backend): swap to pgStore when STORE_DRIVER=postgres is supported.
const cache: QueryStore = new MemoryStore({
  ttlMs: 30 * 60 * 1000,
  maxEntries: 500,
});

export const visibilityRouter = Router();

visibilityRouter.post(
  "/api/visibility",
  async (req: Request, res: Response<ErrorResponse | unknown>, next: NextFunction) => {
    const parsed = InputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid_input",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      } satisfies ErrorResponse);
    }
    try {
      const result = await runVisibilityPipeline({
        keyword: parsed.data.keyword,
        store: parsed.data.store,
        cache,
      });
      return res.json(result);
    } catch (err) {
      // Pipeline failures (OpenAI errors, timeouts, schema/size issues) all
      // map to 502 upstream_failed. Unknown framework errors fall through to
      // the global handler installed in index.ts.
      const message = err instanceof Error ? err.message : "pipeline failed";
      console.error(
        JSON.stringify({
          level: "error",
          msg: "visibility_pipeline_failed",
          keyword: parsed.data.keyword,
          store: parsed.data.store,
          error: message,
        }),
      );
      return res.status(502).json({
        error: "upstream_failed",
        message,
      } satisfies ErrorResponse);
    }
  },
);
```

- [ ] **Step 4: Wire the router into `createApp()` (`server/src/index.ts`)**

Edit `server/src/index.ts` — add the import and the `app.use()` call. After this task, `createApp()` looks like:

```ts
import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";
import { visibilityRouter } from "./routes/visibility.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(healthRouter);
  app.use(visibilityRouter);
  return app;
}

const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/src/index.ts") ||
  process.argv[1]?.endsWith("/dist/index.js");

if (isEntry) {
  const { getEnv } = await import("./lib/env.js");
  const env = getEnv();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT}`);
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && bun run test src/routes/visibility.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the full server test suite**

Run: `cd server && bun run test`
Expected: PASS (all suites green).

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/visibility.ts server/src/routes/visibility.test.ts server/src/index.ts
git commit -m "feat(server): add POST /api/visibility route with zod validation"
```

---

## Task 12: Final Express boot wiring — CORS, request logging, global error handler

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Replace `server/src/index.ts` contents**

```ts
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { healthRouter } from "./routes/health.js";
import { visibilityRouter } from "./routes/visibility.js";
import type { ErrorResponse } from "./types.js";

export function createApp(corsOrigin?: string): Express {
  const app = express();
  if (corsOrigin) {
    app.use(cors({ origin: corsOrigin }));
  }
  app.use(express.json({ limit: "32kb" }));

  // Request log + request-id (structured JSON).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      console.log(
        JSON.stringify({
          level: "info",
          msg: "request",
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms: Date.now() - start,
        }),
      );
    });
    next();
  });

  app.use(healthRouter);
  app.use(visibilityRouter);

  // Final fallback — unknown errors.
  app.use(
    (err: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
      const message = err instanceof Error ? err.message : "internal error";
      console.error(
        JSON.stringify({ level: "error", msg: "unhandled", error: message }),
      );
      if (res.headersSent) return;
      res.status(500).json({ error: "internal", message: "Internal server error" });
    },
  );

  return app;
}

const isEntry =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/src/index.ts") ||
  process.argv[1]?.endsWith("/dist/index.js");

if (isEntry) {
  const { getEnv } = await import("./lib/env.js");
  const env = getEnv();
  const app = createApp(env.CORS_ORIGIN);
  app.listen(env.PORT, () => {
    console.log(
      JSON.stringify({ level: "info", msg: "listening", port: env.PORT }),
    );
  });
}
```

- [ ] **Step 2: Run the server test suite to confirm nothing regressed**

Run: `cd server && bun run test`
Expected: PASS.

- [ ] **Step 3: Smoke-test manually**

Run (one terminal): `cd server && OPENAI_API_KEY=sk-test bun run dev`
Then:
```bash
curl -s http://localhost:8787/health
# → {"status":"ok"}

curl -s -X POST http://localhost:8787/api/visibility \
  -H 'content-type: application/json' \
  -d '{"keyword":"","store":""}'
# → {"error":"invalid_input","message":"..."} with HTTP 400
```
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat(server): add CORS, request logging, global error handler"
```

---

## Task 13: `proc-compose.yml` at repo root

**Files:**
- Create: `proc-compose.yml`

- [ ] **Step 1: Create `proc-compose.yml`**

```yaml
merge:
  client: 8080   # Vite (unchanged from vite.config.ts)
  server: 8787   # Express
  port: 3000     # single port the developer opens in the browser

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

- [ ] **Step 2: Verify config loads**

Run (at repo root): `proc-compose list`
Expected: Lists `backend` and `frontend` processes without errors.

- [ ] **Step 3: Smoke-test the whole stack**

Ensure `server/.env` exists with a valid `OPENAI_API_KEY` (copy from `.env.example` and fill in). Then:

Run: `proc-compose up`
Expected: Both processes come up; `backend ready` appears before `frontend ready`; merge-port reports listening on `:3000`. Open `http://localhost:3000` — the landing page loads. `Ctrl+C` stops everything cleanly.

- [ ] **Step 4: Commit**

```bash
git add proc-compose.yml
git commit -m "chore: add proc-compose config for single-terminal dev"
```

---

## Task 14: Frontend integration — call real API, error toast

**Files:**
- Modify: `src/pages/Index.tsx`

The existing `Hero.onCheck` handler calls a fake `setTimeout` + `generateMockResults()`. We replace that with a `fetch` to `/api/visibility`, wire up `sonner` toasts for errors, and keep `ResultsSidebar`'s props unchanged. `AiRanking` in `ResultsSidebar.tsx` already uses optional `isUser?: boolean`, which our server-side `AiRanking` (required `isUser: boolean`) is a subtype of — no frontend type changes needed.

Sonner is already installed (`package.json` → `"sonner": "^1.7.4"`). Check whether a `<Toaster />` instance is already mounted in `src/main.tsx` or `src/App.tsx`; if not, mount one in this task as the first step.

- [ ] **Step 1: Check whether a Sonner `<Toaster />` is already mounted**

Run: `grep -rn "Toaster" src/ | grep -v "/ui/toaster"`
- If output includes a `sonner` `Toaster` already mounted at app root → skip step 2.
- If nothing is mounted → proceed to step 2.

- [ ] **Step 2 (conditional): Mount `<Toaster />` in `src/App.tsx` at the top level of `App`**

Open `src/App.tsx`, add near the top of imports:

```tsx
import { Toaster as SonnerToaster } from "sonner";
```

And inside the returned JSX, at the same level as `<BrowserRouter>` (or wherever top-level providers live), add:

```tsx
<SonnerToaster position="top-right" richColors closeButton />
```

- [ ] **Step 3: Rewrite `src/pages/Index.tsx`**

```tsx
import { useState } from "react";
import { toast } from "sonner";
import SiteNav from "@/components/landing/SiteNav";
import Hero from "@/components/landing/Hero";
import Methodology from "@/components/landing/Methodology";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ResultsSidebar, { type AiRanking } from "@/components/landing/ResultsSidebar";

type VisibilityResponse = {
  results: AiRanking[];
  userRank: number | null;
  cached: boolean;
  queryId: string;
  model: string;
  searchedAt: string;
};

type ErrorResponse = { error: string; message: string };

const Index = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [store, setStore] = useState("");
  const [results, setResults] = useState<AiRanking[]>([]);

  const handleCheck = async ({ keyword: k, store: s }: { keyword: string; store: string }) => {
    setKeyword(k);
    setStore(s);
    setResults([]);
    setLoading(true);
    setOpen(true);

    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: k, store: s }),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json().catch(() => ({
          error: "internal",
          message: `Request failed (${res.status})`,
        }));
        toast.error("Visibility check failed", {
          description: body.message,
          action: {
            label: "Retry",
            onClick: () => handleCheck({ keyword: k, store: s }),
          },
        });
        setOpen(false);
        return;
      }

      const data = (await res.json()) as VisibilityResponse;
      setResults(data.results);
    } catch (err) {
      toast.error("Visibility check failed", {
        description: err instanceof Error ? err.message : "Network error",
        action: {
          label: "Retry",
          onClick: () => handleCheck({ keyword: k, store: s }),
        },
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero onCheck={handleCheck} loading={loading} />
        <Methodology />
        <FeatureGrid />
      </main>

      <ResultsSidebar
        open={open}
        loading={loading}
        keyword={keyword}
        store={store}
        results={results}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default Index;
```

- [ ] **Step 4: Remove the now-unused mock import, if applicable**

Search the codebase for other uses of `generateMockResults`:

Run: `grep -rn "generateMockResults" src/`
- If only `src/lib/mockData.ts` remains (the definition itself), leave it — other files or admin pages may reference the rest of `mockData.ts`. Do not delete the file.
- If no other file imports it, you can delete just the `generateMockResults` export from `src/lib/mockData.ts`. Otherwise leave it alone — admin mock data lives elsewhere but stay conservative.

- [ ] **Step 5: End-to-end smoke test**

1. Ensure `server/.env` has a **real** `OPENAI_API_KEY` (this step makes a live API call).
2. Run `proc-compose up` at repo root.
3. Open `http://localhost:3000`.
4. Submit the landing form with one of the built-in suggestions (e.g. keyword "Best waxing product for sensitive skin", store "yourstore.com").
5. Confirm:
   - Results panel opens with a loading state.
   - After the pipeline completes (typically 10–30s), 10 real results appear.
   - Check the browser devtools Network tab → `POST /api/visibility` returned 200 with a `results` array of length 10.
   - Submit the same query again → network returns fast (cached), `cached: true` in the response body.
6. Try an invalid submit: open devtools → run `fetch("/api/visibility", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ keyword: "", store: "" }) }).then(r => r.status)` → expect `400`.
7. Stop `proc-compose` with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Index.tsx src/App.tsx
git commit -m "feat(landing): call real /api/visibility, handle errors via sonner"
```

---

## Self-review (run by plan author)

**Spec coverage:**
- Architecture diagram → Tasks 7, 10, 11, 12, 13 (Express + pipeline + cache + merge-port).
- API contract shape → Task 2 (types), Task 11 (route returns `VisibilityResponse`). Error codes → Task 11 (invalid_input, upstream_failed), Task 12 (internal).
- Two-stage pipeline → Tasks 8, 9, 10.
- Storage layer with `QueryStore` interface → Task 6.
- Error handling rules → Tasks 10 (min 5 entries, truncate at 10), 11 (400/502), 12 (500 fallback).
- Dev workflow with proc-compose → Task 13.
- `/health` probe → Task 7.
- Env vars (.env.example) → Task 1.
- TODO comments for deferred items (rate limit, pg store) → Task 11.
- Frontend changes: remove setTimeout, real fetch, error toast, no mock fallback → Task 14.

**Placeholder scan:** No TBDs, TODOs-in-lieu-of-code, "implement later", or "add error handling" hand-waves. The only `TODO(landing-backend):` comments are the spec's explicit deferrals (rate limiting, Postgres driver) documented as such.

**Type consistency:** `AiRanking`, `VisibilityResponse`, `ErrorResponse`, and `ErrorCode` are defined once in `server/src/types.ts` (Task 2) and imported by pipeline (Task 10), route (Task 11), and app boot (Task 12). `QueryStore` and `VisibilityRecord` are defined in `server/src/store/types.ts` (Task 6) and used by `MemoryStore` (Task 6) and the orchestrator (Task 10). `normalize`, `cacheKey`, `storeMatches` signatures match between Task 4 definition and consumers in Tasks 6 and 10. `runSearch` / `runFormat` signatures in Tasks 8 and 9 match their mocks and callers in Task 10.
