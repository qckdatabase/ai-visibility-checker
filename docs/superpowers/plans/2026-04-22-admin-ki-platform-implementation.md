# Admin + Keyword Intelligence Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the keyword intelligence platform — Postgres persistence, pipeline upgrades (domain resolution + category detection), admin rebuild with real data, and landing page widget.

**Architecture:** Three sequential milestones. M1 adds domain resolution + category detection to the existing GPT-4o pipeline (no DB change). M2 replaces the memory store with Postgres, persisting every query with its full result set. M3 adds shared-password auth, admin API routes, rewrites 4 admin pages, and adds the "Top stores by category" widget to the landing page.

**Tech Stack:** Express + GPT-4o Responses API (existing) | Postgres (`pg`) | JWT (`jsonwebtoken`) | bcrypt | React + Recharts (existing) | zod (existing)

**Worktree:** `.worktrees/admin-ki-platform` on branch `feat/admin-ki-platform`

---

## File Map

### New files to create

```
server/src/lib/resolveDomain.ts       — M1: GPT-4o + web_search domain resolver
server/src/db/pgStore.ts            — M2: Postgres QueryStore implementation
server/src/db/migrate.ts             — M2: creates Postgres tables
server/src/db/index.ts               — M2: DB pool + migrate export
server/src/lib/auth.ts               — M3: JWT sign/verify, password hash/verify
server/src/middleware/adminAuth.ts    — M3: JWT cookie validation middleware
server/src/routes/admin/login.ts     — M3: POST /api/admin/login
server/src/routes/admin/logout.ts    — M3: POST /api/admin/logout
server/src/routes/admin/config.ts    — M3: GET/PATCH /api/admin/config
server/src/routes/admin/dashboard.ts — M3: GET /api/admin/dashboard
server/src/routes/admin/queries.ts   — M3: GET /api/admin/queries + /queries/:id/brands
server/src/routes/admin/keywords.ts  — M3: GET /api/admin/keywords
server/src/routes/admin/stores.ts    — M3: GET /api/admin/stores
server/src/index.ts                  — M2/M3: DB boot, admin route registration
src/pages/AdminKeywords.tsx          — M3: replaces AdminAnalytics
```

### Existing files to modify

```
server/src/types.ts                  — M1: add category to VisibilityResponse
server/src/pipeline/format.ts       — M1: add category to stage 2 output
server/src/pipeline/index.ts         — M1: call resolveDomain, pass category
server/src/pipeline/types.ts        — M1: add Category type
server/src/routes/visibility.ts     — M1: handle domain resolution result, store rawStore
server/src/store/types.ts            — M2: add rawStore, category to VisibilityRecord
server/src/store/index.ts            — M2: wire pgStore
server/src/lib/env.ts                — M2: validate DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH
server/.env.example                  — M2: add new env vars
server/package.json                  — M2: add pg, bcrypt, jsonwebtoken + types
server/vitest.config.ts              — M2: add @types/pg, @types/bcrypt, @types/jsonwebtoken
server/src/lib/errors.ts             — M2: add DomainResolutionError
server/src/index.ts                  — M3: DB init, admin route mount, auth middleware
server/src/lib/openai.ts             — M3: reload API key from env on each call
src/App.tsx                          — M3: add /admin/keywords route, drop /admin/models, /admin/leads
src/components/admin/AdminSidebar.tsx — M3: remove Leads and Models nav items
src/pages/AdminDashboard.tsx         — M3: rewrite with real API data
src/pages/AdminQueries.tsx           — M3: rewrite with real API data + expandable rows
src/pages/AdminStores.tsx            — M3: rewrite with real API data
src/pages/AdminAnalytics.tsx         — M3: replace with AdminKeywords (new page)
src/pages/AdminSettings.tsx          — M3: add OpenAI key rotation + admin password change
src/pages/Index.tsx                  — M3: add "Top stores by category" widget
src/lib/adminMockData.ts             — M3: mark obsolete (or keep for dev fallback)
```

---

## Milestone 1: Pipeline + Category (Domain Resolution + Auto-detected Category)

**Prerequisite:** None — operates on existing pipeline, no DB changes.

---

### Task M1.1: Domain Resolver

Create `server/src/lib/resolveDomain.ts`. Given a brand/store name with no dot, calls GPT-4o + web_search to resolve it to a real domain.

**Files:**
- Create: `server/src/lib/resolveDomain.ts`
- Test: `server/src/lib/resolveDomain.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// server/src/lib/resolveDomain.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveDomain } from "./resolveDomain.js";

vi.mock("../lib/openai.js");

describe("resolveDomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the domain as-is if it already contains a dot", async () => {
    const result = await resolveDomain("lumen-skin.com");
    expect(result).toBe("lumen-skin.com");
  });

  it("resolves a brand name to a domain via GPT-4o + web_search", async () => {
    const mockResponse = {
      output_text: "lumen-skin.com",
    };
    // Mock OpenAI responses.create returning the text
    const createSpy = vi.spyOn(await import("../lib/openai.js"), "createOpenAIResponse")
      .mockResolvedValue(mockResponse);

    const result = await resolveDomain("Lumen Skin");
    expect(createSpy).toHaveBeenCalled();
    expect(result).toBe("lumen-skin.com");
  });

  it("returns 'unknown' when GPT cannot determine the domain", async () => {
    const mockResponse = { output_text: "unknown" };
    vi.spyOn(await import("../lib/openai.js"), "createOpenAIResponse")
      .mockResolvedValue(mockResponse);

    const result = await resolveDomain("some totally obscure brand xyz123");
    expect(result).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- server/src/lib/resolveDomain.test.ts`
Expected: FAIL — `resolveDomain` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```typescript
// server/src/lib/resolveDomain.ts
import { createOpenAIResponse } from "./openai.js";

const DOMAIN_RESOLUTION_PROMPT = (input: string) =>
  `Given the brand or store name '{input}', return only its primary website domain ` +
  `(e.g. 'lumen-skin.com'). If you cannot determine it with reasonable confidence, ` +
  `return exactly 'unknown'. Do not include https:// or trailing slashes.`;

export async function resolveDomain(input: string): Promise<string> {
  // If it looks like a domain already, return it unchanged
  if (input.includes(".")) return input.trim().toLowerCase();

  try {
    const response = await createOpenAIResponse({
      model: "gpt-4o",
      input: DOMAIN_RESOLUTION_PROMPT(input),
      tools: [{ type: "web_search_preview" }],
      toolSettings: { webSearchPreview: { searchContext: "a" } },
      maxTokens: 30,
    });

    const text = response.output_text?.trim() ?? "unknown";
    return text === "unknown" || !text.includes(".") ? "unknown" : text.toLowerCase();
  } catch {
    return "unknown";
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- server/src/lib/resolveDomain.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/resolveDomain.ts server/src/lib/resolveDomain.test.ts
git commit -m "feat(server): add domain resolver using GPT-4o + web_search"
```

---

### Task M1.2: Pipeline Types — Add Category

Update `server/src/pipeline/types.ts` to add `category` to stage 2 output.

**Files:**
- Modify: `server/src/pipeline/types.ts`

- [ ] **Step 1: Read the current file**

Run: Read `server/src/pipeline/types.ts`

- [ ] **Step 2: Add Category type and update Stage2Output**

```typescript
export type Stage2Output = {
  results: AiRanking[];   // exactly 10 entries
  category: string;         // auto-detected category
  userMatched: boolean;     // true if user's store was detected in results
};
```

- [ ] **Step 3: Commit**

```bash
git add server/src/pipeline/types.ts
git commit -m "feat(server): add category to pipeline types"
```

---

### Task M1.3: Stage 2 Format — Return Category

Update `server/src/pipeline/format.ts` to extract category from the keyword and return it in Stage2Output.

**Files:**
- Modify: `server/src/pipeline/format.ts`

- [ ] **Step 1: Read the current file**

Run: Read `server/src/pipeline/format.ts`

- [ ] **Step 2: Update the schema and prompt**

Add `category` to the `json_schema` output schema and add a classification instruction to the prompt. The category taxonomy is: `Beauty, Apparel, Home, Wellness, Office, Food, Pets, Sports, Kids, Electronics, Other`.

```typescript
// Inside formatSearchResults(), update the prompt:
// Add after the existing "Extract the ranked list..." instruction:
// "Also classify the search intent of this keyword into exactly one category
//  from this list: Beauty, Apparel, Home, Wellness, Office, Food, Pets,
//  Sports, Kids, Electronics, Other. Return it as a field named 'category'."

// Also update the json_schema to include:
const schema = {
  name: "RankingResult",
  strict: true,
  schema: {
    type: "object",
    properties: {
      results: { /* existing AiRanking array schema */ },
      category: {
        type: "string",
        enum: ["Beauty","Apparel","Home","Wellness","Office","Food","Pets","Sports","Kids","Electronics","Other"]
      },
      userMatched: { type: "boolean" },
    },
    required: ["results", "category", "userMatched"],
    additionalProperties: false,
  },
};
```

- [ ] **Step 3: Update return type in pipeline/index.ts**

The `formatSearchResults` function returns `Promise<{ results: AiRanking[]; userMatched: boolean }>`. Update it to `Promise<Stage2Output>` and return `{ results, category, userMatched }`.

- [ ] **Step 4: Run server tests**

Run: `bun run test -- server/`
Expected: FAIL on `pipeline/index.test.ts` — old return type expected

- [ ] **Step 5: Update the pipeline/index.ts test to match new return type**

The test mocks `formatSearchResults` and should now return `{ results, category: "Beauty", userMatched: false }`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun run test -- server/`
Expected: PASS (all 24 tests)

- [ ] **Step 7: Commit**

```bash
git add server/src/pipeline/format.ts server/src/pipeline/index.ts server/src/pipeline/index.test.ts
git commit -m "feat(server): add category auto-detection to stage 2 format"
```

---

### Task M1.4: Pipeline Orchestrator — Domain Resolution + Category

Update `server/src/pipeline/index.ts` to:
1. Call `resolveDomain` if store has no dot
2. Pass `category` through to the final output
3. Update `VisibilityResponse` type in `server/src/types.ts`

**Files:**
- Modify: `server/src/pipeline/index.ts`, `server/src/types.ts`

- [ ] **Step 1: Read the current pipeline/index.ts**

Run: Read `server/src/pipeline/index.ts`

- [ ] **Step 2: Update runPipeline signature and body**

```typescript
import { resolveDomain } from "../lib/resolveDomain.js";

export async function runPipeline(
  keyword: string,
  store: string,         // raw user input — may be brand name or domain
): Promise<VisibilityResponse> {
  // Resolve domain if needed (for cache key + storage)
  const resolvedDomain = await resolveDomain(store);
  if (resolvedDomain === "unknown") {
    throw new PipelineError(
      "invalid_input",
      `Could not resolve a website for '${store}'. Please enter a store URL or a well-known brand name.`,
    );
  }

  // Use resolvedDomain for cache key
  const cacheKey = normalize(keyword, resolvedDomain);
  const cached = await store.get(keyword, resolvedDomain);
  if (cached) {
    return { ...cached.result, cached: true };
  }

  // Stage 1: grounded search (prompt uses raw store input)
  const stage1Text = await runSearch(keyword, store);

  // Stage 2: format + category detection (stage2Output now includes category)
  const stage2Output = await formatSearchResults(stage1Text, resolvedDomain);

  // Fuzzy match
  const { results, userRank } = fuzzyMatch(stage2Output.results, resolvedDomain);

  const result: VisibilityResponse = {
    results,
    userRank,
    cached: false,
    queryId: uuidv4(),
    model: "gpt-4o",
    searchedAt: new Date().toISOString(),
    category: stage2Output.category,   // new field
  };

  await store.put({ keyword, store: resolvedDomain, rawStore: store, category: stage2Output.category, result, createdAt: new Date() });

  return result;
}
```

- [ ] **Step 3: Update server/src/types.ts VisibilityResponse**

```typescript
export type VisibilityResponse = {
  results: AiRanking[];
  userRank: number | null;
  cached: boolean;
  queryId: string;
  model: "gpt-4o";
  searchedAt: string;
  category: string;   // NEW — auto-detected category
};
```

- [ ] **Step 4: Update server/src/store/types.ts VisibilityRecord**

```typescript
export type VisibilityRecord = {
  keyword: string;
  store: string;        // resolved domain
  rawStore: string;     // original user input (NEW)
  category: string;     // auto-detected (NEW)
  result: VisibilityResponse;
  createdAt: Date;
};
```

- [ ] **Step 5: Update server/src/store/memoryStore.ts to handle new fields**

The `put` method signature changes — update the `VisibilityRecord` shape. The memory store implementation itself doesn't need changes (it stores whatever is passed), but the call site in `pipeline/index.ts` now passes `rawStore` and `category`.

- [ ] **Step 6: Update visibility.ts route**

Read `server/src/routes/visibility.ts`. The route calls `runPipeline(keyword, store)` — no changes needed to the call itself. However, the `log` line should also log `category`. Update: `log({ keyword, store, cached, resultCount: result.results.length, category: result.category, totalMs: Date.now() - start });`

- [ ] **Step 7: Run server tests**

Run: `bun run test -- server/`
Expected: PASS — all existing tests pass with updated types

- [ ] **Step 8: Commit**

```bash
git add server/src/pipeline/index.ts server/src/types.ts server/src/store/types.ts server/src/routes/visibility.ts
git commit -m "feat(server): wire domain resolver and category through pipeline"
```

---

## Milestone 2: Postgres Persistence

**Prerequisite:** M1 complete. All pipeline changes are interface-preserving — the `QueryStore` interface still only has `get`/`put`.

---

### Task M2.1: Add Dependencies

Add `pg`, `bcrypt`, `jsonwebtoken` (and their types) to `server/package.json`.

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Read current package.json**

Run: Read `server/package.json`

- [ ] **Step 2: Add new dependencies**

```json
"dependencies": {
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.13.0"
},
"devDependencies": {
  "@types/bcrypt": "^5.0.9",
  "@types/jsonwebtoken": "^9.0.7",
  "@types/pg": "^8.11.10"
}
```

- [ ] **Step 3: Install**

Run: `cd server && bun install`

- [ ] **Step 4: Commit**

```bash
git add server/package.json
git commit -m "chore(server): add pg, bcrypt, jsonwebtoken dependencies"
```

---

### Task M2.2: Postgres Env Validation

Update `server/src/lib/env.ts` to validate `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD` (optional — falls back to `ADMIN_PASSWORD_HASH`), and `ADMIN_PASSWORD_HASH` (optional — required if `ADMIN_PASSWORD` not set).

**Files:**
- Modify: `server/src/lib/env.ts`, `server/.env.example`

- [ ] **Step 1: Read current env.ts**

Run: Read `server/src/lib/env.ts`

- [ ] **Step 2: Add new env vars to the schema**

```typescript
// Add to the env schema:
DATABASE_URL: z.string().url(),
JWT_SECRET: z.string().min(32),   // must be at least 32 chars
ADMIN_PASSWORD: z.string().min(8).optional(),  // plain-text, for initial setup
ADMIN_PASSWORD_HASH: z.string().optional(),   // bcrypt hash, alternative to plain-text
```

- [ ] **Step 3: Update .env.example**

Add the new env vars with comments explaining each one.

- [ ] **Step 4: Run env tests**

Run: `bun run test -- server/src/lib/env.test.ts`
Expected: FAIL — env schema changed, existing tests use no DB env vars

- [ ] **Step 5: Update env.test.ts**

The existing tests pass empty env. Add the new required fields: `DATABASE_URL`, `JWT_SECRET`. Also add a test for the case where neither `ADMIN_PASSWORD` nor `ADMIN_PASSWORD_HASH` is set (should be an error).

- [ ] **Step 6: Run tests**

Run: `bun run test -- server/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/lib/env.ts server/.env.example
git commit -m "feat(server): add DATABASE_URL, JWT_SECRET, admin password env validation"
```

---

### Task M2.3: DB Pool + Migration

Create `server/src/db/index.ts` (DB pool singleton) and `server/src/db/migrate.ts` (creates all tables).

**Files:**
- Create: `server/src/db/index.ts`, `server/src/db/migrate.ts`
- Modify: `server/src/index.ts` (import and run migrate on boot)

- [ ] **Step 1: Write db/index.ts**

```typescript
// server/src/db/index.ts
import pg from "pg";
import { DATABASE_URL } from "../lib/env.js";

const { Pool } = pg;

export const db = new Pool({ connectionString: DATABASE_URL });

export async function initDb() {
  const client = await db.connect();
  try {
    await migrate(client);
  } finally {
    client.release();
  }
}

async function migrate(client: pg.PoolClient) {
  await client.query(sql`
    CREATE TABLE IF NOT EXISTS queries (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      keyword     TEXT NOT NULL,
      store       TEXT NOT NULL,
      raw_store   TEXT NOT NULL,
      category    TEXT NOT NULL,
      user_rank   INTEGER,
      cached      BOOLEAN NOT NULL DEFAULT false,
      model       TEXT NOT NULL DEFAULT 'gpt-4o',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ranked_brands (
      id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
      rank     INTEGER NOT NULL,
      brand    TEXT NOT NULL,
      url      TEXT NOT NULL,
      is_user  BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS category_top_keywords (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category    TEXT NOT NULL,
      keyword     TEXT NOT NULL,
      query_count INTEGER NOT NULL DEFAULT 1,
      last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(category, keyword)
    );

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_queries_category   ON queries(category);
    CREATE INDEX IF NOT EXISTS idx_queries_store     ON queries(store);
    CREATE INDEX IF NOT EXISTS idx_queries_keyword  ON queries(keyword);
    CREATE INDEX IF NOT EXISTS idx_queries_created  ON queries(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ranked_brands_qid ON ranked_brands(query_id);
    CREATE INDEX IF NOT EXISTS idx_category_top_cat  ON category_top_keywords(category);
  `);
}
```

- [ ] **Step 2: Update server/src/index.ts to call initDb on boot**

After `app.listen`, call `initDb().catch(console.error)`. Or better: await it before `app.listen` so the server doesn't start if the DB is unreachable.

```typescript
// In server/src/index.ts:
import { initDb } from "./db/index.js";

const app = express();
// ... existing middleware and routes ...

// Boot: init DB, then start server
const port = Number(PORT);
await initDb();  // throws if DB unreachable — server won't start
app.listen(port, () => console.log(`Server ready on ${port}`));
```

- [ ] **Step 3: Commit**

```bash
git add server/src/db/index.ts server/src/db/migrate.ts server/src/index.ts
git commit -m "feat(server): add Postgres DB pool and migration"
```

---

### Task M2.4: Postgres Store Implementation

Create `server/src/db/pgStore.ts` implementing the `QueryStore` interface. Persists to `queries` and `ranked_brands` in a transaction, and upserts `category_top_keywords`.

**Files:**
- Create: `server/src/db/pgStore.ts`
- Test: `server/src/db/pgStore.test.ts`

- [ ] **Step 1: Write pgStore.ts**

```typescript
// server/src/db/pgStore.ts
import type { QueryStore, VisibilityRecord } from "../store/types.js";
import { db } from "./index.js";

export function createPgStore(): QueryStore {
  return {
    async get(keyword: string, store: string): Promise<VisibilityRecord | null> {
      const result = await db.query(
        `SELECT * FROM queries WHERE keyword = $1 AND store = $2 AND created_at > now() - INTERVAL '30 minutes' ORDER BY created_at DESC LIMIT 1`,
        [keyword, store],
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        keyword: row.keyword,
        store: row.store,
        rawStore: row.raw_store,
        category: row.category,
        result: {
          results: [],    // caller can fetch ranked_brands separately if needed
          userRank: row.user_rank,
          cached: row.cached,
          queryId: row.id,
          model: row.model,
          searchedAt: row.created_at.toISOString(),
          category: row.category,
        },
        createdAt: row.created_at,
      };
    },

    async put(record: VisibilityRecord): Promise<void> {
      const client = await db.connect();
      try {
        await client.query("BEGIN");

        // Insert query record
        const queryResult = await client.query(
          `INSERT INTO queries (keyword, store, raw_store, category, user_rank, cached, model)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            record.keyword,
            record.store,
            record.rawStore,
            record.category,
            record.result.userRank,
            record.result.cached,
            record.result.model,
          ],
        );
        const queryId = queryResult.rows[0].id;

        // Insert ranked_brands in bulk
        for (const brand of record.result.results) {
          await client.query(
            `INSERT INTO ranked_brands (query_id, rank, brand, url, is_user)
             VALUES ($1, $2, $3, $4, $5)`,
            [queryId, brand.rank, brand.brand, brand.url, brand.isUser],
          );
        }

        // Upsert category_top_keywords
        await client.query(
          `INSERT INTO category_top_keywords (category, keyword, query_count, last_seen)
           VALUES ($1, $2, 1, now())
           ON CONFLICT (category, keyword)
           DO UPDATE SET query_count = category_top_keywords.query_count + 1, last_seen = now()`,
          [record.category, record.keyword],
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}
```

- [ ] **Step 2: Wire pgStore in store/index.ts**

Read `server/src/store/index.ts`. Replace the memory store instantiation with:

```typescript
import { createPgStore } from "../db/pgStore.js";

const store: QueryStore =
  process.env.STORE_DRIVER === "postgres" ? createPgStore() : createMemoryStore();
```

Also update the `store.get` caller in `pipeline/index.ts` — the `cached` path returns `cached.result` which now has an empty `results` array. For the cache hit path in `pipeline/index.ts`, we need to also fetch `ranked_brands` for the cached query. Update `pgStore.get` to also join and return `results`:

```typescript
// In pgStore.get, after fetching the query row, also fetch ranked_brands:
const brandsResult = await db.query(
  `SELECT rank, brand, url, is_user FROM ranked_brands WHERE query_id = $1 ORDER BY rank`,
  [row.id],
);
const results = brandsResult.rows.map((r) => ({
  rank: r.rank, brand: r.brand, url: r.url, isUser: r.is_user,
}));
```

- [ ] **Step 3: Write a basic pgStore test**

```typescript
// server/src/db/pgStore.test.ts
// Skip this test if DATABASE_URL is not set (use vi.mock for DB calls)
import { describe, it, expect } from "vitest";

describe("createPgStore", () => {
  it("implements the QueryStore interface", () => {
    const store = createPgStore();
    expect(typeof store.get).toBe("function");
    expect(typeof store.put).toBe("function");
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add server/src/db/pgStore.ts server/src/store/index.ts
git commit -m "feat(server): implement pgStore with transaction-based persistence"
```

---

### Task M2.5: Update Pipeline Index — Pass rawStore and category

Update `server/src/pipeline/index.ts` to pass `rawStore` and `category` to `store.put()`.

**Files:**
- Modify: `server/src/pipeline/index.ts`

- [ ] **Step 1: Read current pipeline/index.ts**

- [ ] **Step 2: Update the store.put call to include new fields**

```typescript
await store.put({
  keyword,
  store: resolvedDomain,
  rawStore: store,           // raw user input
  category: stage2Output.category,
  result,
  createdAt: new Date(),
});
```

- [ ] **Step 3: Run server tests**

Run: `bun run test -- server/`
Expected: PASS (all tests pass)

- [ ] **Step 4: Commit**

```bash
git add server/src/pipeline/index.ts
git commit -m "feat(server): pass rawStore and category to store.put"
```

---

## Milestone 3: Admin Rebuild

**Prerequisite:** M2 complete. All admin routes depend on the DB.

---

### Task M3.1: Auth Utilities

Create `server/src/lib/auth.ts` — JWT sign/verify and password hash/verify helpers.

**Files:**
- Create: `server/src/lib/auth.ts`

- [ ] **Step 1: Write auth.ts**

```typescript
// server/src/lib/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, ADMIN_PASSWORD_HASH } from "./env.js";

export async function verifyPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): object {
  return jwt.verify(token, JWT_SECRET) as object;
}

export const COOKIE_NAME = "qck_admin_token";

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 8 * 60 * 60 * 1000,  // 8 hours
    path: "/",
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/auth.ts
git commit -m "feat(server): add auth utilities (JWT, bcrypt)"
```

---

### Task M3.2: Admin Auth Middleware

Create `server/src/middleware/adminAuth.ts` — validates JWT cookie on all `/api/admin/*` routes.

**Files:**
- Create: `server/src/middleware/adminAuth.ts`

- [ ] **Step 1: Write adminAuth middleware**

```typescript
// server/src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME } from "../lib/auth.js";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
```

Note: You may need the `@types/express` `Request` and `Response` from the existing types, and `NextFunction` from `express`. The cookie parser is `cookie` npm package — add it as a dependency in `server/package.json`.

- [ ] **Step 2: Add cookie parser to Express app**

In `server/src/index.ts`, add: `import cookieParser from "cookie"; app.use(cookieParser());`

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/adminAuth.ts server/src/index.ts
git commit -m "feat(server): add admin auth middleware"
```

---

### Task M3.3: Admin Login + Logout Routes

Create `server/src/routes/admin/login.ts` and `server/src/routes/admin/logout.ts`.

**Files:**
- Create: `server/src/routes/admin/login.ts`, `server/src/routes/admin/logout.ts`
- Modify: `server/src/index.ts` — register these routes

- [ ] **Step 1: Write login.ts**

```typescript
// server/src/routes/admin/login.ts
import { Router } from "express";
import { verifyPassword, signToken, COOKIE_NAME, cookieOptions } from "../../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  const valid = await verifyPassword(password);
  if (!valid) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  const token = signToken({ role: "admin" });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Write logout.ts**

```typescript
// server/src/routes/admin/logout.ts
import { Router } from "express";
import { COOKIE_NAME, cookieOptions } from "../../lib/auth.js";

const router = Router();

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 3: Register in server/src/index.ts**

```typescript
import adminLogin from "./routes/admin/login.js";
import adminLogout from "./routes/admin/logout.js";

app.use("/api/admin", adminLogin);   // no auth — this IS the login endpoint
app.use("/api/admin", adminLogout); // no auth — logout clears the cookie
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/admin/login.ts server/src/routes/admin/logout.ts server/src/index.ts
git commit -m "feat(server): add admin login and logout routes"
```

---

### Task M3.4: Admin Dashboard API Route

Create `server/src/routes/admin/dashboard.ts` — aggregated stats for the Dashboard page.

**Files:**
- Create: `server/src/routes/admin/dashboard.ts`

- [ ] **Step 1: Write the route**

```typescript
// server/src/routes/admin/dashboard.ts
import { Router } from "express";
import { db } from "../../db/index.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuth);

router.get("/dashboard", async (_req, res) => {
  const client = await db.connect();
  try {
    // Total queries and unique counts
    const [{ totalQueries, uniqueKeywords, uniqueStores, cacheHits }] = (
      await client.query(`
        SELECT
          COUNT(*)::int as "totalQueries",
          COUNT(DISTINCT keyword)::int as "uniqueKeywords",
          COUNT(DISTINCT store)::int as "uniqueStores",
          COUNT(*) FILTER (WHERE cached = true)::int as "cacheHits"
        FROM queries
      `)
    ).rows;

    const cacheHitRate = totalQueries > 0
      ? Math.round((cacheHits / totalQueries) * 100)
      : 0;

    // Top categories
    const topCategories = (
      await client.query(`
        SELECT category, COUNT(*)::int as count
        FROM queries
        GROUP BY category
        ORDER BY count DESC
        LIMIT 6
      `)
    ).rows;

    // Queries over time (last 14 days)
    const queriesOverTime = (
      await client.query(`
        SELECT
          DATE(created_at) as day,
          COUNT(*)::int as queries
        FROM queries
        WHERE created_at > now() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY day
      `)
    ).rows;

    // Top keywords (last 7 days)
    const topKeywords = (
      await client.query(`
        SELECT keyword, COUNT(*)::int as count
        FROM queries
        WHERE created_at > now() - INTERVAL '7 days'
        GROUP BY keyword
        ORDER BY count DESC
        LIMIT 10
      `)
    ).rows;

    // Top stores by query count
    const topStores = (
      await client.query(`
        SELECT
          store,
          COUNT(*)::int as "queryCount",
          ROUND(AVG(user_rank))::int as "avgRank"
        FROM queries
        GROUP BY store
        ORDER BY "queryCount" DESC
        LIMIT 10
      `)
    ).rows;

    res.json({
      totalQueries,
      uniqueKeywords,
      uniqueStores,
      cacheHitRate,
      topCategories,
      queriesOverTime,
      topKeywords,
      topStores,
    });
  } finally {
    client.release();
  }
});

export default router;
```

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import adminDashboard from "./routes/admin/dashboard.js";
app.use("/api/admin", adminDashboard);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin/dashboard.ts server/src/index.ts
git commit -m "feat(server): add admin dashboard API route"
```

---

### Task M3.5: Admin Config Route — OpenAI Key Rotation

Create `server/src/routes/admin/config.ts` — GET/PATCH config, including OpenAI key rotation.

**Files:**
- Create: `server/src/routes/admin/config.ts`

- [ ] **Step 1: Write the config route**

```typescript
// server/src/routes/admin/config.ts
import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { db } from "../../db/index.js";
import { OPENAI_API_KEY, QUERY_RETENTION_DAYS } from "../../lib/env.js";

const router = Router();
router.use(adminAuth);

// GET /api/admin/config — returns public config
router.get("/config", async (_req, res) => {
  const keyRow = await db.query(
    `SELECT value FROM config WHERE key = 'openai_api_key'`,
  );
  const storedKey = keyRow.rows[0]?.value ?? "";
  const effectiveKey = storedKey || OPENAI_API_KEY;

  res.json({
    openaiApiKeyStatus: effectiveKey ? "active" : "not_set",
    openaiApiKeyMasked: effectiveKey
      ? effectiveKey.slice(0, 8) + "***" + effectiveKey.slice(-6)
      : null,
    adminPasswordSet: true,
    queryRetentionDays: QUERY_RETENTION_DAYS ?? 90,
    serverVersion: process.env.npm_package_version ?? "0.0.1",
  });
});

// PATCH /api/admin/config — update mutable config
router.patch("/config", async (req, res) => {
  const { openaiApiKey, queryRetentionDays } = req.body as {
    openaiApiKey?: string;
    queryRetentionDays?: number;
  };

  if (openaiApiKey !== undefined) {
    await db.query(
      `INSERT INTO config (key, value) VALUES ('openai_api_key', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [openaiApiKey],
    );
    // The OpenAI client singleton re-reads from the env loader on each call,
    // so we set an env override. The cleanest approach: write to a temp file
    // that the env loader reads. For now: require a server restart.
    // TODO: implement hot-reload of OpenAI key without restart.
  }

  if (queryRetentionDays !== undefined) {
    await db.query(
      `INSERT INTO config (key, value) VALUES ('query_retention_days', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [String(queryRetentionDays)],
    );
  }

  res.json({ ok: true });
});

export default router;
```

Note: The OpenAI key hot-reload is a deferred improvement — for now, rotation requires a restart. Add a `TODO` comment in the code marking this as a future improvement.

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import adminConfig from "./routes/admin/config.js";
app.use("/api/admin", adminConfig);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin/config.ts server/src/index.ts
git commit -m "feat(server): add admin config route with OpenAI key rotation"
```

---

### Task M3.6: Admin Queries Route + Brands Detail

Create `server/src/routes/admin/queries.ts` — paginated query log + per-query ranked brands detail.

**Files:**
- Create: `server/src/routes/admin/queries.ts`

- [ ] **Step 1: Write the queries route**

```typescript
// server/src/routes/admin/queries.ts
import { Router } from "express";
import { db } from "../../db/index.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuth);

router.get("/queries", async (req, res) => {
  const {
    keyword = "",
    store = "",
    category = "",
    from = "",
    to = "",
    page = "1",
    limit = "50",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (keyword) {
    conditions.push(`keyword ILIKE $${paramIdx++}`);
    params.push(`%${keyword}%`);
  }
  if (store) {
    conditions.push(`store ILIKE $${paramIdx++}`);
    params.push(`%${store}%`);
  }
  if (category) {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }
  if (from) {
    conditions.push(`created_at >= $${paramIdx++}`);
    params.push(from);
  }
  if (to) {
    conditions.push(`created_at <= $${paramIdx++}`);
    params.push(to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await db.query(
    `SELECT COUNT(*)::int as total FROM queries ${where}`,
    params,
  );
  const total = countResult.rows[0].total;

  const rowsResult = await db.query(
    `SELECT id, keyword, store, category, user_rank, cached, created_at
     FROM queries ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, pageSize, offset],
  );

  res.json({
    rows: rowsResult.rows.map((r) => ({
      id: r.id,
      keyword: r.keyword,
      store: r.store,
      category: r.category,
      userRank: r.user_rank,
      cached: r.cached,
      createdAt: r.created_at.toISOString(),
    })),
    total,
    page: pageNum,
    pageSize,
  });
});

router.get("/queries/:id/brands", async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT rank, brand, url, is_user
     FROM ranked_brands
     WHERE query_id = $1
     ORDER BY rank`,
    [id],
  );
  res.json({
    brands: result.rows.map((r) => ({
      rank: r.rank,
      brand: r.brand,
      url: r.url,
      isUser: r.is_user,
    })),
  });
});

export default router;
```

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import adminQueries from "./routes/admin/queries.js";
app.use("/api/admin", adminQueries);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin/queries.ts server/src/index.ts
git commit -m "feat(server): add admin queries API route with pagination and brands detail"
```

---

### Task M3.7: Admin Keywords Route

Create `server/src/routes/admin/keywords.ts` — keyword intelligence data.

**Files:**
- Create: `server/src/routes/admin/keywords.ts`

- [ ] **Step 1: Write the keywords route**

```typescript
// server/src/routes/admin/keywords.ts
import { Router } from "express";
import { db } from "../../db/index.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuth);

router.get("/keywords", async (req, res) => {
  const { category = "", sort = "volume", page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * pageSize;

  const categoryCondition = category ? `WHERE category = $1` : "";

  const topKeywords = (
    await db.query(
      `SELECT keyword, category, query_count, last_seen
       FROM category_top_keywords
       ${categoryCondition}
       ORDER BY query_count DESC
       LIMIT $${category ? 2 : 1} OFFSET $${category ? 3 : 2}`,
      category ? [category, pageSize, offset] : [pageSize, offset],
    )
  ).rows;

  // Trending = keywords whose count increased week-over-week
  const trendingKeywords = (
    await db.query(`
      SELECT ct.keyword, ct.category,
        ct.query_count - COALESCE(prev.query_count, 0) as delta
      FROM category_top_keywords ct
      LEFT JOIN (
        SELECT keyword, category, query_count
        FROM category_top_keywords
        WHERE last_seen < now() - INTERVAL '7 days'
      ) prev ON prev.keyword = ct.keyword AND prev.category = ct.category
      WHERE ct.query_count > (COALESCE(prev.query_count, 0))
      ORDER BY delta DESC
      LIMIT 20
    `)
  ).rows;

  // Category breakdown
  const categoryBreakdown = (
    await db.query(`
      SELECT category, COUNT(*)::int as count
      FROM queries
      GROUP BY category
      ORDER BY count DESC
    `)
  ).rows;

  res.json({
    topKeywords: topKeywords.map((r) => ({
      keyword: r.keyword,
      category: r.category,
      queryCount: r.query_count,
      lastSeen: r.last_seen?.toISOString?.() ?? r.last_seen,
    })),
    trendingKeywords: trendingKeywords.map((r) => ({
      keyword: r.keyword,
      category: r.category,
      delta: r.delta,
    })),
    categoryBreakdown,
  });
});

export default router;
```

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import adminKeywords from "./routes/admin/keywords.js";
app.use("/api/admin", adminKeywords);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin/keywords.ts server/src/index.ts
git commit -m "feat(server): add admin keywords intelligence API route"
```

---

### Task M3.8: Admin Stores Route

Create `server/src/routes/admin/stores.ts` — scanned stores derived from queries.

**Files:**
- Create: `server/src/routes/admin/stores.ts`

- [ ] **Step 1: Write the stores route**

```typescript
// server/src/routes/admin/stores.ts
import { Router } from "express";
import { db } from "../../db/index.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();
router.use(adminAuth);

router.get("/stores", async (req, res) => {
  const { page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * pageSize;

  const countResult = await db.query(`SELECT COUNT(DISTINCT store)::int as total FROM queries`);
  const total = countResult.rows[0].total;

  const rowsResult = await db.query(`
    SELECT
      store,
      COUNT(*)::int as "queryCount",
      MAX(created_at) as "lastSeen",
      ROUND(AVG(user_rank))::int as "avgRank",
      MAX(user_rank) FILTER (WHERE user_rank IS NOT NULL) as "lastUserRank"
    FROM queries
    GROUP BY store
    ORDER BY "queryCount" DESC
    LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  res.json({
    rows: rowsResult.rows.map((r) => ({
      store: r.store,
      queryCount: r.queryCount,
      lastSeen: r.lastSeen?.toISOString?.() ?? r.lastSeen,
      avgRank: r.avgRank,
      lastUserRank: r.lastUserRank,
    })),
    total,
  });
});

export default router;
```

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import adminStores from "./routes/admin/stores.js";
app.use("/api/admin", adminStores);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin/stores.ts server/src/index.ts
git commit -m "feat(server): add admin stores API route"
```

---

### Task M3.9: Rewrite AdminDashboard

Rewrite `src/pages/AdminDashboard.tsx` to fetch from `GET /api/admin/dashboard` instead of mock data.

**Files:**
- Modify: `src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Read the current AdminDashboard.tsx**

- [ ] **Step 2: Replace mock data imports with TanStack Query fetch**

Replace the `import { dashboardStats, modelDistribution, queriesOverTime, topQuestions } from "@/lib/mockData";` with a `useQuery` hook:

```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["admin", "dashboard"],
  queryFn: () => fetch("/api/admin/dashboard", { credentials: "include" }).then(r => {
    if (!r.ok) throw new Error("Failed to load");
    return r.json();
  }),
});
```

Replace all `dashboardStats.X` references with `data?.X`. Use `isLoading` to show skeleton/loading state instead of the existing spinner.

**Key changes:**
- Drop: `modelDistribution` chart (we only use GPT-4o)
- Drop: `topQuestions` table
- Replace with: `topCategories` pie chart, `topKeywords` table, `queriesOverTime` area chart, `topStores` table
- Rename "AI Model Mix" panel → "Top Categories"
- Add "Cache Hit Rate" KPI card (new metric)
- KPI cards: Total Queries, Unique Keywords, Unique Stores, Cache Hit Rate

- [ ] **Step 3: Run frontend build**

Run: `bun run build` in the worktree root
Expected: PASS with no errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat(frontend): rewrite AdminDashboard with real API data"
```

---

### Task M3.10: Rewrite AdminQueries with Expandable Rows

Rewrite `src/pages/AdminQueries.tsx` to fetch from `GET /api/admin/queries`. Add expandable row drawer showing `GET /api/admin/queries/:id/brands`.

**Files:**
- Modify: `src/pages/AdminQueries.tsx`

- [ ] **Step 1: Read the current AdminQueries.tsx**

- [ ] **Step 2: Replace with real data fetching + expandable rows**

Replace the static `recentQueries` import with `useQuery` against `/api/admin/queries`. Add `useState` for the currently expanded query ID. When expanded, fetch `/api/admin/queries/${id}/brands` and show the ranked brands in an inline accordion below the row.

Key changes:
- Replace `recentQueries` filter with `useQuery` + URL param state
- Add "expand" arrow column at the end of each row
- Expanded section: show a mini table with rank, brand, URL, and whether it's the user's store
- Replace `model` column with `category` column (we only use GPT-4o now)

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminQueries.tsx
git commit -m "feat(frontend): rewrite AdminQueries with real data and expandable brand rows"
```

---

### Task M3.11: Rewrite AdminStores

Rewrite `src/pages/AdminStores.tsx` to fetch from `GET /api/admin/stores`.

**Files:**
- Modify: `src/pages/AdminStores.tsx`

- [ ] **Step 1: Read the current AdminStores.tsx**

- [ ] **Step 2: Replace mock stores data with useQuery**

Replace `import { stores, type StoreRow, type LeadStatus } from "@/lib/adminMockData";` with `useQuery` from `/api/admin/stores`.

**Key changes:**
- Drop `contactEmail` column (no email stored)
- Drop `leadStatus` column (no CRM data)
- Rename `visibility` → use `avgRank` and `lastUserRank` instead
- Replace `health` badge with `lastUserRank` display (null = "Opportunity")
- Stats: Total Scanned Domains, Avg Rank, Opportunities (count where avgRank is null or high)
- Add category filter derived from the data

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminStores.tsx
git commit -m "feat(frontend): rewrite AdminStores with real API data"
```

---

### Task M3.12: Replace AdminAnalytics → AdminKeywords

Create `src/pages/AdminKeywords.tsx` replacing `AdminAnalytics`. Fetch from `GET /api/admin/keywords`.

**Files:**
- Create: `src/pages/AdminKeywords.tsx`
- Modify: `src/App.tsx` (route for `/admin/keywords`), `src/components/admin/AdminSidebar.tsx` (nav item)

- [ ] **Step 1: Write AdminKeywords.tsx**

Use the same structure as the existing `AdminAnalytics` but with real data from `/api/admin/keywords`:

- Top keywords table (keyword, category, query count, last seen)
- Trending keywords (week-over-week delta) — show placeholder if no data yet
- Category breakdown pie chart
- Drop: model performance chart, funnel chart

```typescript
import { useQuery } from "@tanstack/react-query";
import AdminShell from "@/components/admin/AdminShell";
// ... existing imports (Recharts components, Button from shadcn)

export default function AdminKeywords() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "keywords"],
    queryFn: () => fetch("/api/admin/keywords", { credentials: "include" }).then(r => r.json()),
  });

  return (
    <AdminShell eyebrow="Insights" title="Keyword Intelligence" actions={<Button variant="outline" size="sm">Last 30 days</Button>}>
      {/* Stats row */}
      {/* Category pie chart */}
      {/* Top keywords table */}
      {/* Trending keywords (if data exists) */}
    </AdminShell>
  );
}
```

- [ ] **Step 2: Add route to App.tsx**

```typescript
import AdminKeywords from "./pages/AdminKeywords.tsx";
// Add route: <Route path="/admin/keywords" element={<AdminKeywords />} />
```

- [ ] **Step 3: Update AdminSidebar nav**

In `src/components/admin/AdminSidebar.tsx`, update the `NAV` array:
- Rename the `Analytics` section → `Insights`
- Change `BarChart3` icon item from `/admin/analytics` → `/admin/keywords`
- Remove the `Analytics` link (now replaced by `Keyword Intelligence`)
- Drop the entire "Platform" section with `Models` link

Current NAV structure to modify:
```typescript
{
  section: "Monitoring",   // rename to "Overview" if desired
  items: [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    // Remove: { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
},
```

Actually, keep `Analytics` for consistency with the "Insights" eyebrow. Just update the route to `/admin/keywords`.

- [ ] **Step 4: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminKeywords.tsx src/App.tsx src/components/admin/AdminSidebar.tsx
git commit -m "feat(frontend): add AdminKeywords page, update sidebar, remove Models nav"
```

---

### Task M3.13: Update AdminSettings — OpenAI Key Rotation

Update `src/pages/AdminSettings.tsx` to add OpenAI API key rotation and admin password change sections.

**Files:**
- Modify: `src/pages/AdminSettings.tsx`

- [ ] **Step 1: Read the current AdminSettings.tsx**

- [ ] **Step 2: Add new sections to the existing settings page**

Add these new sections alongside the existing ones:

**OpenAI API Key section:**
```typescript
// Fetch config on mount
const { data: config } = useQuery({
  queryKey: ["admin", "config"],
  queryFn: () => fetch("/api/admin/config", { credentials: "include" }).then(r => r.json()),
});

// Display masked key + status
<p>Status: {config?.openaiApiKeyStatus}</p>
<p>Key: {config?.openaiApiKeyMasked ?? "Not set"}</p>

// Rotate button → PATCH /api/admin/config with new key
const rotateKey = async () => {
  const newKey = prompt("Enter new OpenAI API key:");
  if (!newKey) return;
  await fetch("/api/admin/config", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openaiApiKey: newKey }),
  });
  queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
};
```

**Admin Password section:**
```typescript
// Change password form
// POST /api/admin/change-password (new endpoint — add to server/routes/admin/)
// Simple: current password + new password + confirm
```

Note: The "change password" requires a new server endpoint. Create `server/src/routes/admin/password.ts`:

```typescript
// server/src/routes/admin/password.ts
import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { verifyPassword, hashPassword } from "../../lib/auth.js";
import { db } from "../../db/index.js";

router.post("/change-password", adminAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Both passwords required" });
    return;
  }
  const valid = await verifyPassword(currentPassword);
  if (!valid) {
    res.status(401).json({ error: "Current password incorrect" });
    return;
  }
  const hash = await hashPassword(newPassword);
  await db.query(
    `INSERT INTO config (key, value) VALUES ('admin_password_hash', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [hash],
  );
  res.json({ ok: true });
});
```

Register it in `server/src/index.ts`.

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminSettings.tsx server/src/routes/admin/password.ts server/src/index.ts
git commit -m "feat(frontend): add OpenAI key rotation and password change to Settings"
```

---

### Task M3.14: Landing Page — "Top Stores by Category" Widget

Add a "Top Stores by Category" section to `src/pages/Index.tsx` that fetches from `GET /api/admin/keywords` (or a new lightweight endpoint) and displays a category-grouped carousel of top keywords + their top-ranked brand.

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Read the current Index.tsx**

Run: Read `src/pages/Index.tsx`

- [ ] **Step 2: Add the widget**

Add a new section before `SiteFooter` in the Index page. It should:
- Fetch from `GET /api/admin/keywords` on mount (no auth needed for public data — consider creating a new public endpoint `GET /api/public/top-keywords` that returns the same data without auth)
- Display categories as tabs/pills
- Show top 3-5 keywords per category with their top brand

If auth is required for `/api/admin/keywords`, add a public endpoint in `server/src/routes/public.ts`:

```typescript
// server/src/routes/public.ts
import { Router } from "express";
import { db } from "../db/index.js";

const router = Router();

router.get("/top-keywords", async (_req, res) => {
  const topKeywords = await db.query(`
    SELECT ct.category, ct.keyword, ct.query_count,
           rb.brand, rb.url, rb.rank
    FROM category_top_keywords ct
    JOIN LATERAL (
      SELECT rb.brand, rb.url, rb.rank
      FROM ranked_brands rb
      JOIN queries q ON q.id = rb.query_id
      WHERE q.keyword = ct.keyword AND q.category = ct.category
      ORDER BY rb.rank
      LIMIT 1
    ) rb ON true
    WHERE ct.last_seen > now() - INTERVAL '30 days'
    ORDER BY ct.category, ct.query_count DESC
  `);
  res.json({ keywords: topKeywords.rows });
});

export default router;
```

Register in `server/src/index.ts`: `app.use("/api/public", publicRouter);`

For the frontend widget: show categories as horizontal scrollable pills, and for each selected category show the top keywords with their #1 brand. Link each brand to its URL (open in new tab).

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/Index.tsx server/src/routes/public.ts server/src/index.ts
git commit -m "feat(frontend): add Top Stores by Category widget to landing page"
```

---

### Task M3.15: App.tsx — Remove Dead Routes

Clean up `src/App.tsx` to remove the routes for `AdminLeads` and `AdminModels` which are no longer built.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read App.tsx**

- [ ] **Step 2: Remove AdminLeads and AdminModels imports and routes**

```typescript
// Remove:
// import AdminLeads from "./pages/AdminLeads.tsx";
// import AdminModels from "./pages/AdminModels.tsx";

// Remove:
// <Route path="/admin/leads" element={<AdminLeads />} />
// <Route path="/admin/users" element={<AdminLeads />} />
// <Route path="/admin/models" element={<AdminModels />} />
```

Also remove the import for `AdminAnalytics` since it's now replaced by `AdminKeywords`.

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "chore(frontend): remove obsolete AdminLeads and AdminModels routes"
```

---

## Spec Coverage Check

| Spec Section | Task |
|---|---|
| M1: Domain resolution (M1.1) | Task M1.1 |
| M1: Category taxonomy + detection (M1.2, M1.3) | Tasks M1.2, M1.3, M1.4 |
| M2: Postgres schema + migrate (5.1, 5.2) | Task M2.3 |
| M2: pgStore implementation (6) | Task M2.4 |
| M2: Store interface update (6) | Task M2.5 |
| M2: Env validation (12) | Task M2.2 |
| M3: Admin auth (7.1, 7.2, 7.3) | Tasks M3.1, M3.2, M3.3 |
| M3: OpenAI key rotation (8) | Tasks M3.5, M3.13 |
| M3: Dashboard API (9) | Task M3.4 |
| M3: Queries API (9) | Task M3.6 |
| M3: Keywords API (9) | Task M3.7 |
| M3: Stores API (9) | Task M3.8 |
| M3: Config API (9) | Task M3.5 |
| M3: Rewrite Dashboard (10.1) | Task M3.9 |
| M3: Rewrite Query Log (10.2) | Task M3.10 |
| M3: Rewrite Stores (10.4) | Task M3.11 |
| M3: Keyword Intelligence (10.3) | Task M3.12 |
| M3: Settings (10.5) | Task M3.13 |
| M3: Landing widget (11) | Task M3.14 |
| M3: Drop Leads/Models routes (10, App.tsx) | Task M3.15 |
