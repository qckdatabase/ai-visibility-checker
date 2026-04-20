# Landing-page backend design

**Date:** 2026-04-21
**Status:** Approved (pending implementation plan)
**Scope:** Backend for the public landing page only. Admin pages remain on mock data for a future phase.

## Goal

Replace the mock `generateMockResults()` on the landing page with a real backend that, given `{ keyword, store }`, returns a ranked list of stores/brands recommended by GPT-4o (web-search-grounded), indicating whether the user's own store appears in that list.

## Non-goals (for this phase)

- Admin API endpoints or admin-facing analytics
- Persisting query history (no DB yet; in-memory cache only)
- Real authentication for `/admin`
- Rate limiting (deferred — see "Deferred" section)
- Production deploy config

## Architecture

```
┌─────────────────┐    POST /api/visibility      ┌────────────────────────┐
│  Vite React app │ ───────────────────────────▶ │  Express server        │
│  (port 8080)    │    { keyword, store }        │  (port 8787)           │
│                 │ ◀─────────────────────────── │                        │
└─────────────────┘    { results, userRank,      └────────────────────────┘
                         cached, model, ... }                │
                                                             ▼
                                          ┌────────────────────────────────┐
                                          │  visibilityPipeline.ts         │
                                          │                                │
                                          │  1. cache.get(key) ─hit─▶ return│
                                          │  2. gpt4o.groundedSearch()     │
                                          │     (web_search tool, free-form)│
                                          │  3. gpt4o.formatToJSON()       │
                                          │     (json_schema, deterministic)│
                                          │  4. fuzzy-match user store,    │
                                          │     compute userRank           │
                                          │  5. cache.put(key, result)     │
                                          └────────────────────────────────┘
```

Dev: all three processes (Vite, Express, merge-port) run under `proc-compose` on the user's machine. merge-port routes `/api/*` → Express, everything else → Vite, on a single port (`:3000`).

## Repo layout

```
server/
  src/
    index.ts              # express app boot
    routes/
      visibility.ts       # POST /api/visibility
      health.ts           # GET /health (for proc-compose probe)
    pipeline/
      search.ts           # GPT-4o grounded web_search call
      format.ts           # GPT-4o json_schema reformatter
      index.ts            # orchestrates search → format + cache
    store/
      types.ts            # QueryStore interface + VisibilityRecord type
      memoryStore.ts      # in-memory LRU impl (current)
      # pgStore.ts        # future Postgres impl
    lib/
      openai.ts           # single OpenAI client
      env.ts              # zod-validated env loader
      normalize.ts        # shared keyword/store normalization
  package.json
  tsconfig.json
  .env.example            # documents required env vars
proc-compose.yml          # at repo root
```

## API contract

**`POST /api/visibility`**

Request:
```ts
{ keyword: string; store: string }   // both required, trimmed, non-empty
```

Success response (200):
```ts
{
  results: AiRanking[];     // exactly 10 entries, matches existing frontend shape
  userRank: number | null;  // rank of user's store if found, else null
  cached: boolean;          // true if served from cache
  queryId: string;          // uuid, reserved for future analytics/debug
  model: "gpt-4o";
  searchedAt: string;       // ISO timestamp
}

// AiRanking (already defined in src/components/landing/ResultsSidebar.tsx):
// { rank: number; brand: string; reason: string; isUser: boolean }
```

When the user's store is found, the matching entry inside `results[]` has `isUser: true`, and `userRank` equals that entry's `rank`. The frontend may use either signal to highlight the entry in the list.

Error responses:
| HTTP | `error` code | Cause |
|---|---|---|
| 400 | `invalid_input` | missing/empty `keyword` or `store` |
| 429 | `rate_limited` | reserved for later — not emitted in this phase |
| 502 | `upstream_failed` | OpenAI error, timeout, or stage-2 schema violation |
| 500 | `internal` | anything else |

Body shape: `{ error: string; message: string }`.

**`GET /health`**

Returns `{ status: "ok" }` with 200. No OpenAI call, no cache read. Used by proc-compose's readiness probe.

## Two-stage pipeline

**Stage 1 — grounded search (`pipeline/search.ts`)**

Calls GPT-4o's Responses API with the `web_search` tool enabled. Prompt embeds both the keyword and the user's store so the model considers it:

```
System: You are an e-commerce discovery assistant. Given a shopper's
query, use web search to identify the top ~10 online stores or brands
a shopper would be recommended today. Consider whether the user's own
store appears in this set.

User: Shopper query: "{keyword}"
       User's store: "{store}"
       Return: a ranked list of the 10 most recommended stores/brands,
       each with a one-sentence reason, citing web sources where relevant.
       If the user's store belongs in the top 10, include it at the
       appropriate rank and say so.
```

Output is free-form prose with citations. We do not parse it — we pass it to stage 2 as-is.

**Stage 2 — format to JSON (`pipeline/format.ts`)**

Second GPT-4o call, **no tools**, `response_format: { type: "json_schema" }` with a strict schema matching `AiRanking[]` plus a `userMatched` flag. Input is stage 1's raw text plus the original `store` string. Prompt: *"Extract the ranked list as structured JSON. If the user's store appears, set `isUser: true` on that entry."*

**Post-processing (in `pipeline/index.ts`)**
1. Fuzzy-match the user's `store` against each entry's `brand` (lowercase, strip `www.`/trailing slash, domain-root compare) as a backstop if stage 2 missed it. Set `isUser: true` if matched.
2. Compute `userRank` from whichever entry has `isUser: true`; else `null`.
3. Enforce exactly 10 entries: truncate if more; if fewer than 5, the whole response is considered degraded and returned as 502 `upstream_failed` (rare; logged).

**Budget and timeouts**
- Both stages use explicit `max_tokens` limits.
- Total pipeline wall clock capped at 45s via `AbortController`. On timeout → 502 `upstream_failed`.
- **No retries inside the pipeline.** A failed pipeline returns 502; the user hits retry. Auto-retrying each stage doubles OpenAI cost on real failures and masks bugs.

**Client library:** official `openai` npm package.

## Storage layer

Cache-only for this phase, behind an interface so a Postgres implementation can slot in later without touching route or pipeline code.

```ts
// server/src/store/types.ts
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

**In-memory implementation (`memoryStore.ts`):**
- LRU-style `Map` keyed by `normalize(keyword) + "|" + normalize(store)`
- `normalize()` lowercases, trims, strips trailing slash and leading `www.` so "Example.com" and "example.com" hit the same cache entry
- TTL: 30 minutes
- Max 500 entries (oldest-out when full)
- Cache dies on server restart (acceptable for this phase)

**Wiring:** a module-level singleton is constructed at boot based on `STORE_DRIVER` env (`memory` for now). Route handler depends only on the interface.

## Error handling

The rule: **fail loudly on the server, fail gracefully on the client** — no silent fallbacks to mock data.

| Failure | HTTP | `error` code | Handling |
|---|---|---|---|
| Missing/empty `keyword` or `store` | 400 | `invalid_input` | zod-validated at route entry |
| OpenAI API error (auth, 5xx, network) | 502 | `upstream_failed` | OpenAI's message included in dev; sanitized in prod |
| OpenAI timeout (>45s wall clock) | 502 | `upstream_failed` | `AbortController` on both stages |
| Stage 2 returns invalid JSON / schema mismatch | 502 | `upstream_failed` | raw response logged server-side |
| Stage 2 returns fewer than 5 entries | 502 | `upstream_failed` | logged |
| Stage 2 returns 5–9 or 11+ entries | recovered | — | truncate to 10; log warning |
| Unknown exception | 500 | `internal` | generic message to client, full stack in server logs |

**Server logs (structured JSON):**
- every request: `{ requestId, keyword, store, cached, stage1Ms, stage2Ms, totalMs, resultCount }`
- every error: request context + error code + OpenAI response body if applicable

**Frontend changes (`src/pages/Index.tsx` and/or `VisibilityChecker` submit handler):**
- Remove the existing `setTimeout(..., 1800)` fake delay.
- On 2xx → render `ResultsSidebar` with real `results` (unchanged component).
- On non-2xx → inline error toast with a retry button. **Do not** fall back to `generateMockResults()`. Loading, error, and success states stay honest.

## Dev workflow (proc-compose)

**`proc-compose.yml` at repo root:**
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

**Run the stack:** `proc-compose up` → one terminal, one URL (`http://localhost:3000`). `Ctrl+C` stops everything cleanly. The `depends_on` + `ready_when: http` pair eliminates the race where the browser loads before Express can answer API calls.

**Vite config:** no `proxy` section needed — merge-port handles `/api/*` routing. Existing `port: 8080` and `host: "::"` stay as-is.

**Frontend fetch:** `fetch("/api/visibility", ...)` with no hostname. Same-origin in dev (via merge-port) and in prod.

**CORS:** not needed in dev. In prod, `CORS_ORIGIN` env var on the server restricts the allowed frontend origin.

## Environment variables

Documented in `server/.env.example` (committed) and loaded from `server/.env` (git-ignored):

```
OPENAI_API_KEY=sk-...           # required
PORT=8787                       # default 8787
CORS_ORIGIN=http://localhost:3000  # prod only; dev is same-origin
STORE_DRIVER=memory             # memory | postgres (future)
LOG_LEVEL=info                  # info | debug
```

Server boot validates env with zod and exits with a clear message on anything missing or malformed.

## Scripts

**`server/package.json`:**
- `dev` — `tsx watch src/index.ts`
- `build` — `tsc`
- `start` — `node dist/index.js`
- `test` — `vitest run`

Root-level `package.json` scripts remain unchanged; developers run `proc-compose up` from the repo root.

## Testing

- **Unit tests:** `normalize()`, memory cache (set/get/TTL/LRU), stage-2 schema validation.
- **Integration test:** one route-level test that mocks the OpenAI client and asserts:
  - happy path returns the expected shape with `cached: false`, then `cached: true` on a repeat call
  - 400 on empty input
  - 502 on simulated OpenAI error
  - 502 on simulated schema violation
- **No live OpenAI calls in tests.** Cost isn't worth the signal.

Server tests run via Vitest inside `server/` and are independent of the existing frontend test setup.

## Deferred (explicit TODOs for the follow-up phase)

The implementation should leave a `TODO:` comment at the relevant call site for each of these so they're discoverable from the code, not only the spec:

- **Rate limiting** — per-IP limit via `express-rate-limit`. Skipped during testing-phase. Reinstate before making the endpoint public. Also set a hard budget cap in the OpenAI dashboard as a belt-and-braces backstop.
- **Postgres `QueryStore`** — `pgStore.ts` implementing the same interface; switch via `STORE_DRIVER=postgres`.
- **Query log / analytics persistence** — write each request to Postgres to feed real data into admin pages (`recentQueries`, `queriesOverTime`, etc.).
- **Admin API endpoints** — once there's a DB, wire admin pages off real data.
- **Real admin auth** — replace the current no-op redirect in `AdminLogin`.
- **Production deploy config** — Dockerfile, hosting target, secrets management.

## Risks and open questions

- **Stage-1 variability:** web-search-grounded GPT-4o responses can vary substantially in format. Stage 2 normalizes this, but bad stage-1 output (e.g. fewer than 10 brands surfaced) will cascade to 502s. Watch this during prompt tuning.
- **Cost per uncached call:** two GPT-4o calls — stage 1 includes web_search tool, stage 2 is small. Budget cap in the OpenAI dashboard is the backstop. Log `totalMs` and (eventually) token usage to track this.
- **Cache-key collisions across minor variations:** `normalize()` handles the common cases (casing, trailing slash, `www.`). Edge cases like `https://store.com/` vs `store.com` are covered; more exotic inputs may slip through and generate extra calls. Accept for this phase.
- **`searchedAt` on cached responses:** returned value reflects the original search time, not the current request time — that's intentional, so the UI can surface "results from N minutes ago" later if useful.
