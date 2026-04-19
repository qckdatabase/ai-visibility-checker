// Extended mock data for admin pages
export const recentQueries = [
  { id: "q_8821", query: "Best waxing product for sensitive skin", store: "lumen-skin.com", model: "GPT-4o", rank: 7, status: "found", time: "2m ago", category: "Beauty" },
  { id: "q_8820", query: "Sustainable activewear under $80", store: "meridian-apparel.com", model: "Claude 3.5", rank: null, status: "missing", time: "4m ago", category: "Apparel" },
  { id: "q_8819", query: "Best espresso machine for beginners", store: "brewlab.co", model: "GPT-4o", rank: 3, status: "found", time: "11m ago", category: "Home" },
  { id: "q_8818", query: "Eco-friendly dog food brands", store: "barkbasics.com", model: "Gemini Pro", rank: null, status: "missing", time: "14m ago", category: "Pets" },
  { id: "q_8817", query: "Affordable LED desk lamp for designers", store: "northbloom.co", model: "Perplexity", rank: 9, status: "found", time: "22m ago", category: "Office" },
  { id: "q_8816", query: "Vegan multivitamins for women", store: "auralia.health", model: "GPT-4o", rank: 5, status: "found", time: "31m ago", category: "Wellness" },
  { id: "q_8815", query: "Best gravel bikes under $2000", store: "trailforge.cc", model: "Claude 3.5", rank: null, status: "missing", time: "44m ago", category: "Sports" },
  { id: "q_8814", query: "Natural toddler snacks no added sugar", store: "tinyhive.shop", model: "GPT-4o", rank: 2, status: "found", time: "1h ago", category: "Kids" },
  { id: "q_8813", query: "Quietest air purifier for bedroom", store: "calmair.io", model: "Gemini Pro", rank: 6, status: "found", time: "1h ago", category: "Home" },
  { id: "q_8812", query: "Best meal kit for two people", store: "saplingmeals.com", model: "Perplexity", rank: null, status: "missing", time: "2h ago", category: "Food" },
  { id: "q_8811", query: "Sulfate-free shampoo curly hair", store: "ringletco.com", model: "GPT-4o", rank: 8, status: "found", time: "2h ago", category: "Beauty" },
  { id: "q_8810", query: "Standing desk under $500", store: "uprightlab.co", model: "Claude 3.5", rank: 4, status: "found", time: "3h ago", category: "Office" },
];

export const modelPerformance = [
  { model: "GPT-4o", queries: 6018, avgRank: 4.2, ctr: 28.4 },
  { model: "Claude 3.5", queries: 3712, avgRank: 5.1, ctr: 24.1 },
  { model: "Gemini Pro", queries: 2580, avgRank: 5.8, ctr: 21.6 },
  { model: "Perplexity", queries: 1971, avgRank: 4.9, ctr: 26.8 },
];

export const categoryBreakdown = [
  { category: "Beauty", value: 28 },
  { category: "Apparel", value: 22 },
  { category: "Home", value: 18 },
  { category: "Wellness", value: 14 },
  { category: "Office", value: 10 },
  { category: "Other", value: 8 },
];

export const visibilityTrend = [
  { week: "W1", score: 32 },
  { week: "W2", score: 35 },
  { week: "W3", score: 34 },
  { week: "W4", score: 38 },
  { week: "W5", score: 41 },
  { week: "W6", score: 39 },
  { week: "W7", score: 44 },
  { week: "W8", score: 47 },
];

export const funnel = [
  { stage: "Queries", value: 14281 },
  { stage: "Surfaced result", value: 9824 },
  { stage: "CTA viewed", value: 6342 },
  { stage: "Click → qck.co", value: 3514 },
];

// --- System management ---

export type UserRow = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  stores: number;
  queries: number;
  status: "active" | "trial" | "suspended";
  joined: string;
};

export const users: UserRow[] = [
  { id: "u_001", name: "Maya Chen", email: "maya@lumen-skin.com", plan: "Pro", stores: 1, queries: 412, status: "active", joined: "Mar 12, 2025" },
  { id: "u_002", name: "Diego Alvarez", email: "diego@meridian-apparel.com", plan: "Enterprise", stores: 3, queries: 1841, status: "active", joined: "Jan 04, 2025" },
  { id: "u_003", name: "Priya Shah", email: "priya@brewlab.co", plan: "Pro", stores: 1, queries: 287, status: "trial", joined: "Apr 02, 2025" },
  { id: "u_004", name: "Jonas Becker", email: "jonas@northbloom.co", plan: "Free", stores: 1, queries: 24, status: "active", joined: "Apr 14, 2025" },
  { id: "u_005", name: "Aisha Khan", email: "aisha@auralia.health", plan: "Pro", stores: 2, queries: 612, status: "active", joined: "Feb 20, 2025" },
  { id: "u_006", name: "Theo Martin", email: "theo@trailforge.cc", plan: "Free", stores: 1, queries: 8, status: "suspended", joined: "Apr 09, 2025" },
  { id: "u_007", name: "Hana Suzuki", email: "hana@tinyhive.shop", plan: "Pro", stores: 1, queries: 198, status: "active", joined: "Mar 28, 2025" },
  { id: "u_008", name: "Lukas Ritter", email: "lukas@calmair.io", plan: "Enterprise", stores: 5, queries: 2912, status: "active", joined: "Dec 11, 2024" },
];

export type StoreRow = {
  id: string;
  domain: string;
  owner: string;
  category: string;
  visibility: number;
  audits: number;
  lastAudit: string;
  health: "healthy" | "watch" | "critical";
};

export const stores: StoreRow[] = [
  { id: "s_001", domain: "lumen-skin.com", owner: "Maya Chen", category: "Beauty", visibility: 62, audits: 412, lastAudit: "2m ago", health: "healthy" },
  { id: "s_002", domain: "meridian-apparel.com", owner: "Diego Alvarez", category: "Apparel", visibility: 21, audits: 1841, lastAudit: "4m ago", health: "critical" },
  { id: "s_003", domain: "brewlab.co", owner: "Priya Shah", category: "Home", visibility: 71, audits: 287, lastAudit: "11m ago", health: "healthy" },
  { id: "s_004", domain: "northbloom.co", owner: "Jonas Becker", category: "Office", visibility: 44, audits: 24, lastAudit: "22m ago", health: "watch" },
  { id: "s_005", domain: "auralia.health", owner: "Aisha Khan", category: "Wellness", visibility: 58, audits: 612, lastAudit: "31m ago", health: "healthy" },
  { id: "s_006", domain: "trailforge.cc", owner: "Theo Martin", category: "Sports", visibility: 12, audits: 8, lastAudit: "44m ago", health: "critical" },
  { id: "s_007", domain: "tinyhive.shop", owner: "Hana Suzuki", category: "Kids", visibility: 78, audits: 198, lastAudit: "1h ago", health: "healthy" },
  { id: "s_008", domain: "calmair.io", owner: "Lukas Ritter", category: "Home", visibility: 65, audits: 2912, lastAudit: "1h ago", health: "healthy" },
  { id: "s_009", domain: "saplingmeals.com", owner: "Owen Park", category: "Food", visibility: 33, audits: 142, lastAudit: "2h ago", health: "watch" },
];

export type ModelStatus = {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  status: "operational" | "degraded" | "down";
  latency: number; // ms
  errorRate: number; // %
  costPer1k: number; // USD
  share: number; // % of total queries
};

export const aiModels: ModelStatus[] = [
  { id: "m_gpt4o", name: "GPT-4o", provider: "OpenAI", enabled: true, status: "operational", latency: 412, errorRate: 0.4, costPer1k: 5.0, share: 42 },
  { id: "m_claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", enabled: true, status: "operational", latency: 488, errorRate: 0.6, costPer1k: 3.0, share: 26 },
  { id: "m_gemini", name: "Gemini 1.5 Pro", provider: "Google", enabled: true, status: "degraded", latency: 1124, errorRate: 3.2, costPer1k: 2.5, share: 18 },
  { id: "m_pplx", name: "Perplexity Sonar", provider: "Perplexity", enabled: true, status: "operational", latency: 612, errorRate: 0.9, costPer1k: 1.0, share: 14 },
  { id: "m_llama", name: "Llama 3.1 405B", provider: "Meta", enabled: false, status: "operational", latency: 720, errorRate: 1.4, costPer1k: 0.9, share: 0 },
];

export const systemHealth = {
  uptime: 99.982,
  apiLatencyP95: 612,
  errorRate: 0.7,
  queueDepth: 42,
};
