const BASE = "/api/admin";

export interface DashboardStats {
  totalQueries: number;
  uniqueKeywords: number;
  uniqueStores: number;
  cacheHitRate: number;
  topCategories: Array<{ category: string; count: number }>;
  queriesOverTime: Array<{ day: string; queries: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  topStores: Array<{ store: string; queryCount: number; avgRank: number | null }>;
}

export interface QueryRow {
  id: string;
  keyword: string;
  store: string;
  category: string;
  userRank: number | null;
  cached: boolean;
  createdAt: string;
}

export interface QueriesResponse {
  rows: QueryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BrandRow {
  rank: number;
  brand: string;
  url: string;
  isUser: boolean;
}

export interface StoresResponse {
  rows: Array<{
    store: string;
    queryCount: number;
    lastSeen: string | null;
    avgRank: number | null;
    lastUserRank: number | null;
  }>;
  total: number;
}

export interface KeywordRow {
  keyword: string;
  category: string;
  queryCount: number;
  lastSeen: string;
}

export interface TrendingKeyword {
  keyword: string;
  category: string;
  delta: number;
}

export interface KeywordsResponse {
  topKeywords: KeywordRow[];
  categoryBreakdown: Array<{ category: string; count: number }>;
  trendingKeywords: TrendingKeyword[];
}

export interface ConfigResponse {
  openaiApiKeyStatus: "active" | "not_set";
  openaiApiKeyMasked: string;
  adminPasswordSet: boolean;
  queryRetentionDays: number;
  serverVersion: string;
  // Rate limits
  rateLimitChecksPerHour: number;
  rateLimitMaxResults: number;
  rateLimitScanTimeoutMs: number;
  // Feature flags
  flagPublicChecker: boolean;
  flagRequireSignup: boolean;
  flagCompetitorTracking: boolean;
  flagAutoBlockAbuse: boolean;
  // Operator alerts
  alertModelDown: boolean;
  alertErrorSpike: boolean;
  alertQueueBackup: boolean;
  alertAbuseDetected: boolean;
  alertWeeklyDigest: boolean;
  // Danger zone
  maintenanceMode: boolean;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  dashboard: () => fetchJSON<DashboardStats>(`${BASE}/dashboard`),

  queries: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
    ).toString();
    return fetchJSON<QueriesResponse>(`${BASE}/queries${qs ? `?${qs}` : ""}`);
  },

  queryBrands: (id: string) =>
    fetchJSON<{ brands: BrandRow[] }>(`${BASE}/queries/${id}/brands`),

  keywords: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
    ).toString();
    return fetchJSON<KeywordsResponse>(`${BASE}/keywords${qs ? `?${qs}` : ""}`);
  },

  stores: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
    ).toString();
    return fetchJSON<StoresResponse>(`${BASE}/stores${qs ? `?${qs}` : ""}`);
  },

  config: () => fetchJSON<ConfigResponse>(`${BASE}/config`),

  updateConfig: (body: Partial<{
  openaiApiKey: string;
  adminPassword: string;
  queryRetentionDays: number;
  rateLimitChecksPerHour: number;
  rateLimitMaxResults: number;
  rateLimitScanTimeoutMs: number;
  flagPublicChecker: boolean;
  flagRequireSignup: boolean;
  flagCompetitorTracking: boolean;
  flagAutoBlockAbuse: boolean;
  alertModelDown: boolean;
  alertErrorSpike: boolean;
  alertQueueBackup: boolean;
  alertAbuseDetected: boolean;
  alertWeeklyDigest: boolean;
}>) =>
    fetchJSON<{ ok: boolean }>(`${BASE}/config`, { method: "PATCH", body: JSON.stringify(body) }),

  configAction: (body: { action: "enable_maintenance" | "disable_maintenance" | "purge_cache" }) =>
    fetchJSON<{ ok: boolean }>(`${BASE}/config/actions`, { method: "POST", body: JSON.stringify(body) }),

  login: (password: string) =>
    fetchJSON<{ ok: boolean }>(`${BASE}/login`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    fetchJSON<{ ok: boolean }>(`${BASE}/logout`, { method: "POST" }),
};
