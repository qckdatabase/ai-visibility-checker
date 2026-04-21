# Admin + Keyword Intelligence Platform Design

**Date:** 2026-04-22
**Status:** Draft — awaiting user review
**Scope:** Full keyword intelligence platform — Postgres persistence, pipeline upgrades, admin rebuild, landing page widget

---

## 1. Goal

Turn the QCK visibility checker into a keyword intelligence platform for qck.co (an SEO company):

- Every query is **persisted** — keyword, store, category, ranked results
- Admin console shows **real keyword trends**, top categories, competitive gaps
- Landing page surfaces **"Top stores by category"** derived from actual query data
- qck.co team uses this data to apply high-performing keywords to their clients' shops/blogs/services (like Ahrefs, but data is sourced from potential customers checking their own visibility)

**Non-goals:**
- Customer-facing login / per-store dashboards (future phase)
- Multi-user auth with roles (single shared password)
- Rate limiting (deferred)
- Production deploy config (Dockerfile exists as stub)

---

## 2. Three Milestones

Implementation is split into three sequential, independently shippable milestones.

| Milestone | Scope | Deliverable |
|---|---|---|
| **M1: Pipeline + category** | Add category auto-detection and domain resolution to existing pipeline | GPT-4o classifies keyword into category; brand name → real domain resolution |
| **M2: Postgres persistence** | Replace memory store with Postgres; add domain resolution call | Every query persisted; full result set stored; category rollup table maintained |
| **M3: Admin rebuild** | Shared-auth login; admin API routes; rewrite all 4 admin pages; add "Top stores by category" to landing | Real data in admin; landing page widget from live data |

---

## 3. Architecture

```
Landing page form (keyword + store)
         ↓
  Domain resolver — GPT-4o + web_search if no dot in store
         ↓
  GPT-4o pipeline
    Stage 1: web_search grounded search (prompt includes raw store input)
    Stage 2: json_schema formatting + category auto-detection
         ↓
  Postgres
    ├── queries          (keyword, store, category, user_rank, cached, created_at)
    ├── ranked_brands    (full 10-entry result set per query)
    └── category_top_keywords (aggregated rollup for landing page widget)
         ↓
  Admin API routes (/api/admin/*)
         ↓
  Admin pages (Dashboard, Query Log, Keyword Intelligence, Stores, Settings)
         ↓
  Landing page "Top stores by category" (reads category_top_keywords)
```

---

## 4. Pipeline Changes (M1)

### 4.1 Domain Resolution

Triggered when `store` contains no dot (`.`).

```
Input: "Lumen Skin"
Step:  GPT-4o + web_search tool
Prompt: "Given the brand or store name '{input}', return only its primary website domain
         (e.g. 'lumen-skin.com'). If you cannot determine it, return 'unknown'.
         Do not include https:// or trailing slashes."
Output: "lumen-skin.com"  (or "unknown")
```

- If result is `unknown`: return 400 `invalid_input` with message "Couldn't find a website for '{input}'. Please enter your store URL."
- If result has a dot: use it as `resolvedDomain`
- `resolvedDomain` is used for cache key + Postgres `store` column
- Raw `store` input is passed to Stage 1 prompt unchanged
- Cost: one lightweight web_search call per non-domain input

### 4.2 Category Auto-Detection

Added to Stage 2 (format.ts). After extracting ranked brands, GPT-4o classifies the keyword into one of a fixed taxonomy:

```
Category taxonomy: Beauty, Apparel, Home, Wellness, Office, Food, Pets, Sports, Kids, Electronics, Other
```

Prompt addition to Stage 2: *"Classify the search intent of this keyword into exactly one category from the list above. Return the category string."*

Stage 2 response gets a new field:

```ts
type Stage2Output = {
  results: AiRanking[];   // exactly 10 entries
  category: string;       // one of the taxonomy values
  userMatched: boolean;   // true if user's store was detected in results
};
```

The `category` field is stored in `queries.category`.

### 4.3 Updated Pipeline Output

```ts
type VisibilityResponse = {
  results: AiRanking[];     // exactly 10 entries
  userRank: number | null;  // rank of user's store if found
  cached: boolean;
  queryId: string;
  model: "gpt-4o";
  searchedAt: string;       // ISO timestamp
  category: string;         // auto-detected category
};
```

---

## 5. Postgres Schema (M2)

### 5.1 Tables

```sql
-- Core query log
CREATE TABLE queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,
  store       TEXT NOT NULL,          -- resolved domain (e.g. lumen-skin.com)
  raw_store   TEXT NOT NULL,         -- original user input (e.g. "Lumen Skin")
  category    TEXT NOT NULL,
  user_rank   INTEGER,                -- null if store not in results
  cached      BOOLEAN NOT NULL DEFAULT false,
  model       TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full 10-entry result set per query
CREATE TABLE ranked_brands (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL,
  brand    TEXT NOT NULL,
  url      TEXT NOT NULL,
  is_user  BOOLEAN NOT NULL DEFAULT false
);

-- Aggregated keyword counts per category (for landing page widget)
CREATE TABLE category_top_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  keyword     TEXT NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 1,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, keyword)
);

-- System config (single-row key-value table)
CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Initial row: INSERT INTO config (key, value) VALUES ('openai_api_key', '');
```

### 5.2 Indexes

```sql
CREATE INDEX idx_queries_category   ON queries(category);
CREATE INDEX idx_queries_store     ON queries(store);
CREATE INDEX idx_queries_keyword  ON queries(keyword);
CREATE INDEX idx_queries_created   ON queries(created_at DESC);
CREATE INDEX idx_ranked_brands_qid ON ranked_brands(query_id);
CREATE INDEX idx_category_top_cat  ON category_top_keywords(category);
```

### 5.3 Upsert Logic for category_top_keywords

On every new query, upsert into `category_top_keywords`:

```sql
INSERT INTO category_top_keywords (category, keyword, query_count, last_seen)
VALUES ($1, $2, 1, now())
ON CONFLICT (category, keyword)
DO UPDATE SET
  query_count = category_top_keywords.query_count + 1,
  last_seen   = now();
```

---

## 6. Store Interface (M2)

Replace `memoryStore` with `pgStore` implementing the same `QueryStore` interface. Both implementations are swapped via `STORE_DRIVER` env (`memory` → `postgres`).

```ts
// server/src/store/types.ts (unchanged)
export type VisibilityRecord = {
  keyword: string;
  store: string;
  rawStore: string;
  category: string;
  result: VisibilityResponse;
  createdAt: Date;
};

export interface QueryStore {
  get(keyword: string, store: string): Promise<VisibilityRecord | null>;
  put(record: VisibilityRecord): Promise<void>;
}
```

`pgStore` additionally persists to `ranked_brands` and upserts `category_top_keywords` inside the same transaction as the query record.

---

## 7. Admin Auth (M3)

### 7.1 Shared Password

- Password stored in `config` table: `INSERT INTO config (key, value) VALUES ('admin_password', '<hashed>');`
- Also readable from `ADMIN_PASSWORD` env var at boot (env var takes precedence; allows `.env` to work without DB)
- Password hashed with `bcrypt`
- Login page (`AdminLogin.tsx`): POST `/api/admin/login` with `{ password }` → returns a signed JWT (httpOnly cookie, 8h expiry) or 401
- JWT secret from `JWT_SECRET` env var
- Middleware on all `/api/admin/*` routes: validates JWT cookie

### 7.2 Login Flow (AdminLogin.tsx)

- Submit password → `POST /api/admin/login`
- 200 → redirect to `/admin/dashboard`
- 401 → inline error "Incorrect password"

### 7.3 Logout

- `POST /api/admin/logout` → clears cookie → redirect to `/admin`

---

## 8. OpenAI API Key Management (M3)

- Stored in `config` table under key `openai_api_key` (plain text; single-instance env is trusted)
- Defaults to `OPENAI_API_KEY` env var if DB row is empty
- Settings page shows: masked value (`sk-svc***rotated`) and status (`Active` / `Not set`)
- "Rotate key" → `PATCH /api/admin/config/openai_api_key` with new key value → updates DB
- Next API call picks up new key (no restart needed; OpenAI client is a lazy singleton that re-reads from env loader on each call)

---

## 9. Admin API Routes (M3)

All routes require auth (JWT cookie). Return 401 if unauthenticated.

### `GET /api/admin/dashboard`

Returns aggregated stats for the Dashboard page:

```ts
{
  totalQueries: number;
  uniqueKeywords: number;
  uniqueStores: number;
  cacheHitRate: number;        // % of queries where cached=true
  topCategories: Array<{ category: string; count: number; }>;
  queriesOverTime: Array<{ day: string; queries: number; }>;   // last 14 days
  topKeywords: Array<{ keyword: string; count: number; }>;      // last 7 days
  topStores: Array<{ store: string; queryCount: number; avgRank: number | null; }>;
}
```

### `GET /api/admin/queries`

Query params: `?keyword=&store=&category=&from=&to=&page=&limit=`

```ts
{
  rows: Array<{
    id: string;
    keyword: string;
    store: string;
    category: string;
    userRank: number | null;
    cached: boolean;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

### `GET /api/admin/queries/:id/brands`

Returns the `ranked_brands` for a single query (for expandable row detail):

```ts
{ brands: Array<{ rank: number; brand: string; url: string; isUser: boolean; }> }
```

### `GET /api/admin/keywords`

Keyword intelligence: top keywords, trending, category × keyword matrix.

Query params: `?category=&sort=volume|trending&page=&limit=`

```ts
{
  topKeywords: Array<{ keyword: string; category: string; queryCount: number; lastSeen: string; }>;
  categoryBreakdown: Array<{ category: string; count: number; }>;
  trendingKeywords: Array<{ keyword: string; category: string; delta: number; }>;  // week-over-week
}
```

### `GET /api/admin/stores`

All scanned stores (derived from `queries.store`):

```ts
{
  rows: Array<{
    store: string;
    queryCount: number;
    lastSeen: string;
    avgRank: number | null;       // null if store never appeared in results
    lastUserRank: number | null;  // rank when user checked their own store
  }>;
  total: number;
}
```

### `GET /api/admin/config`

Returns public config (masked sensitive fields):

```ts
{
  openaiApiKeyStatus: "active" | "not_set";
  openaiApiKeyMasked: string;  // e.g. "sk-svc***rotated"
  adminPasswordSet: boolean;
  queryRetentionDays: number;
  serverVersion: string;
}
```

### `PATCH /api/admin/config`

Update mutable config. Body: `{ openaiApiKey?: string; queryRetentionDays?: number }`.

### `POST /api/admin/login`

Body: `{ password: string }`. Returns JWT cookie or 401.

### `POST /api/admin/logout`

Clears JWT cookie. Returns 200.

---

## 10. Admin Pages (M3)

All pages use the existing `AdminShell` + `AdminSidebar` layout.

### 10.1 Dashboard (`/admin/dashboard`)

Replaces current Dashboard. Shows:

- **KPI cards**: Total Queries, Unique Keywords, Unique Stores, Cache Hit Rate
- **Query volume trend**: Area chart, last 14 days
- **Top searched keywords**: table, last 7 days
- **Top categories**: pie/donut chart
- **Top stores by query count**: table

Drops: "AI model mix" (GPT-4o only), "QCK.co CTR" (no longer tracked), "Avg Visibility Score"

### 10.2 Query Log (`/admin/queries`)

Rewrites current `AdminQueries` with real data from `GET /api/admin/queries`.

- Filters: keyword search, store, category (dropdown), date range
- Summary chips: total results, found (userRank not null), missing
- Table: same columns as existing (Query, Store, Category, Rank, When) — plus Category column now real
- Expandable rows: click to reveal `ranked_brands` in an inline drawer
- Export: `GET /api/admin/queries?format=csv` → downloads CSV

### 10.3 Keyword Intelligence (`/admin/keywords`)

Replaces `AdminAnalytics`. Shows:

- **Top keywords by volume**: sortable table
- **Category × keyword matrix**: which keywords appear in which categories
- **Trending keywords**: week-over-week delta (requires at least 2 weeks of data)
- **Category breakdown**: pie chart

Drops: model performance charts, funnel (no CRM data)

### 10.4 Stores (`/admin/stores`)

Rewrites current `AdminStores` with data from `GET /api/admin/stores`.

- Stats: Total Scanned Domains, Avg Rank (across all their queries), Opportunities
- Table: Domain, Contact (drop — no email stored), Visibility Score (derived from avg rank), Scans, Last Seen
- No more fake `health` or `leadStatus` fields
- Filter by category (derived from queries)

### 10.5 Settings (`/admin/settings`)

Extends existing `AdminSettings`:

- **System health**: existing stats
- **Rate limits**: existing fields
- **OpenAI API key**: new section — masked display + "Rotate key" button
- **Admin password**: "Change password" form
- **Data retention**: number input (days) → stored in `config.query_retention_days`
- Existing "Danger zone" section preserved

---

## 11. Landing Page Widget (M3)

"Top Stores by Category" section on the landing page.

**Data source**: `category_top_keywords` table joined with `queries` to get top-ranked brand per keyword.

**Query:**
```sql
SELECT
  q.category,
  q.keyword,
  rb.brand,
  rb.url,
  rb.rank,
  COUNT(*) OVER (PARTITION BY q.category) as total_queries_for_keyword
FROM queries q
JOIN ranked_brands rb ON rb.query_id = q.id AND rb.rank = 1
WHERE q.created_at > now() - interval '30 days'
ORDER BY q.category, total_queries_for_keyword DESC
```

**Display**: Carousel or grid grouped by category. Shows top brand per keyword within each category. Refreshes on page load (no caching on the widget itself).

---

## 12. Environment Variables

### Additions to `server/.env.example`

```
# Postgres (new)
DATABASE_URL=postgres://user:pass@localhost:5432/qck

# Auth
ADMIN_PASSWORD=             # fallback if config table has no password set
JWT_SECRET=                 # required; random 32-byte hex

# Existing (referenced)
OPENAI_API_KEY=            # falls back to config table if empty
STORE_DRIVER=postgres       # memory | postgres
```

### Removed from deferred TODOs (M2/M3 complete these)
- ~~Rate limiting~~ — deferred (not in this spec)
- ~~Postgres QueryStore~~ — implemented in M2
- ~~Admin API endpoints~~ — implemented in M3
- ~~Query log persistence~~ — implemented in M2
- ~~Real admin auth~~ — implemented in M3

---

## 13. Testing

- **Unit**: domain resolver, category detection, pgStore upsert logic, JWT auth
- **Integration**: each admin API route with auth + DB; domain resolver with mock OpenAI
- **E2E**: full query → pipeline → Postgres → admin API → admin page render
- No live OpenAI calls in tests

---

## 14. Stores `avgRank` — Clarification

The "Avg Rank" for a store is computed as the average of all `ranked_brands.rank` values where that store appeared with `is_user = true` (i.e., the store was found in other users' search results). If a store has never appeared as a result, `avgRank` is `null`.

```sql
SELECT AVG(rb.rank)::INTEGER
FROM ranked_brands rb
JOIN queries q ON q.id = rb.query_id
WHERE q.store = $1 AND rb.is_user = true;
```

If the store was searched for but never appeared in results, `lastUserRank` (from `queries.user_rank`) is `null` and `avgRank` from `ranked_brands` is also `null`. Such stores appear as "Opportunities" (low visibility).

## 15. Dependencies (additions to server/package.json)

```json
{
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
}
```

## 16. Deferred

- **Rate limiting** — per-IP `express-rate-limit`
- **Customer-facing per-store login** — individual accounts + store dashboard
- **Dark mode tokens** — not defined in design system yet
- **Production deploy** — Dockerfile stub exists, needs secrets management
- **Keyword trend delta** — requires 2+ weeks of data before displaying week-over-week change; show placeholder until then
