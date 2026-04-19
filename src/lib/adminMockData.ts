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

// --- Lead pipeline (store owners who ran a free check) ---

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type LeadPriority = "hot" | "warm" | "cold";

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  domain: string;
  visibility: number; // last scan score 0-100
  scans: number; // how many times they ran a check
  lastScan: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string | null; // QCK rep
  source: "Landing" | "Direct link" | "Referral" | "Ad";
  firstSeen: string;
};

export const leads: LeadRow[] = [
  { id: "l_001", name: "Maya Chen",      email: "maya@lumen-skin.com",        domain: "lumen-skin.com",       visibility: 42, scans: 3, lastScan: "2m ago",   status: "qualified", priority: "hot",  assignedTo: "Sara Bennett",  source: "Landing",     firstSeen: "Mar 12, 2025" },
  { id: "l_002", name: "Diego Alvarez",  email: "diego@meridian-apparel.com", domain: "meridian-apparel.com", visibility: 18, scans: 5, lastScan: "4m ago",   status: "contacted", priority: "hot",  assignedTo: "Marcus Lee",    source: "Ad",          firstSeen: "Jan 04, 2025" },
  { id: "l_003", name: "Priya Shah",     email: "priya@brewlab.co",           domain: "brewlab.co",           visibility: 71, scans: 1, lastScan: "11m ago",  status: "new",       priority: "warm", assignedTo: null,            source: "Landing",     firstSeen: "Apr 02, 2025" },
  { id: "l_004", name: "Jonas Becker",   email: "jonas@northbloom.co",        domain: "northbloom.co",        visibility: 44, scans: 2, lastScan: "22m ago",  status: "new",       priority: "warm", assignedTo: null,            source: "Direct link", firstSeen: "Apr 14, 2025" },
  { id: "l_005", name: "Aisha Khan",     email: "aisha@auralia.health",       domain: "auralia.health",       visibility: 58, scans: 4, lastScan: "31m ago",  status: "converted", priority: "hot",  assignedTo: "Sara Bennett",  source: "Referral",    firstSeen: "Feb 20, 2025" },
  { id: "l_006", name: "Theo Martin",    email: "theo@trailforge.cc",         domain: "trailforge.cc",        visibility: 12, scans: 1, lastScan: "44m ago",  status: "lost",      priority: "cold", assignedTo: "Marcus Lee",    source: "Landing",     firstSeen: "Apr 09, 2025" },
  { id: "l_007", name: "Hana Suzuki",    email: "hana@tinyhive.shop",         domain: "tinyhive.shop",        visibility: 78, scans: 1, lastScan: "1h ago",   status: "new",       priority: "cold", assignedTo: null,            source: "Landing",     firstSeen: "Mar 28, 2025" },
  { id: "l_008", name: "Lukas Ritter",   email: "lukas@calmair.io",           domain: "calmair.io",           visibility: 35, scans: 6, lastScan: "1h ago",   status: "qualified", priority: "hot",  assignedTo: "Elena Park",    source: "Ad",          firstSeen: "Dec 11, 2024" },
  { id: "l_009", name: "Owen Park",      email: "owen@saplingmeals.com",      domain: "saplingmeals.com",     visibility: 28, scans: 2, lastScan: "2h ago",   status: "contacted", priority: "warm", assignedTo: "Elena Park",    source: "Landing",     firstSeen: "Apr 11, 2025" },
  { id: "l_010", name: "Riya Kapoor",    email: "riya@ringletco.com",         domain: "ringletco.com",        visibility: 51, scans: 3, lastScan: "2h ago",   status: "qualified", priority: "warm", assignedTo: "Sara Bennett",  source: "Referral",    firstSeen: "Mar 30, 2025" },
];

export type StoreRow = {
  id: string;
  domain: string;
  contactEmail: string;
  category: string;
  visibility: number;
  scans: number;
  lastScan: string;
  health: "healthy" | "watch" | "critical";
  leadStatus: LeadStatus;
};

export const stores: StoreRow[] = [
  { id: "s_001", domain: "lumen-skin.com",       contactEmail: "maya@lumen-skin.com",        category: "Beauty",   visibility: 42, scans: 3, lastScan: "2m ago",  health: "watch",    leadStatus: "qualified" },
  { id: "s_002", domain: "meridian-apparel.com", contactEmail: "diego@meridian-apparel.com", category: "Apparel",  visibility: 18, scans: 5, lastScan: "4m ago",  health: "critical", leadStatus: "contacted" },
  { id: "s_003", domain: "brewlab.co",           contactEmail: "priya@brewlab.co",           category: "Home",     visibility: 71, scans: 1, lastScan: "11m ago", health: "healthy",  leadStatus: "new" },
  { id: "s_004", domain: "northbloom.co",        contactEmail: "jonas@northbloom.co",        category: "Office",   visibility: 44, scans: 2, lastScan: "22m ago", health: "watch",    leadStatus: "new" },
  { id: "s_005", domain: "auralia.health",       contactEmail: "aisha@auralia.health",       category: "Wellness", visibility: 58, scans: 4, lastScan: "31m ago", health: "healthy",  leadStatus: "converted" },
  { id: "s_006", domain: "trailforge.cc",        contactEmail: "theo@trailforge.cc",         category: "Sports",   visibility: 12, scans: 1, lastScan: "44m ago", health: "critical", leadStatus: "lost" },
  { id: "s_007", domain: "tinyhive.shop",        contactEmail: "hana@tinyhive.shop",         category: "Kids",     visibility: 78, scans: 1, lastScan: "1h ago",  health: "healthy",  leadStatus: "new" },
  { id: "s_008", domain: "calmair.io",           contactEmail: "lukas@calmair.io",           category: "Home",     visibility: 35, scans: 6, lastScan: "1h ago",  health: "watch",    leadStatus: "qualified" },
  { id: "s_009", domain: "saplingmeals.com",     contactEmail: "owen@saplingmeals.com",      category: "Food",     visibility: 28, scans: 2, lastScan: "2h ago",  health: "critical", leadStatus: "contacted" },
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
