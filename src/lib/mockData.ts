import type { AiRanking } from "@/components/landing/ResultsSidebar";

// Hardcoded mock recommendations. The user's store is intentionally absent
// to drive the urgency message and CTA toward QCK.
export function generateMockResults(store: string): AiRanking[] {
  const competitors = [
    { brand: "Glow & Co.", reason: "Frequently cited for sensitive-skin formulations and dermatologist reviews." },
    { brand: "Velvet Botanica", reason: "Mentioned for natural ingredients and a strong content footprint on Reddit." },
    { brand: "Pure Roots Skincare", reason: "Cited in 'best of 2024' editorial roundups indexed by GPT-4o." },
    { brand: "Lumen Skin Studio", reason: "Strong structured data and FAQ schema make it AI-friendly." },
    { brand: "Mossa Apothecary", reason: "High citation volume from indie beauty blogs." },
    { brand: "North Bloom", reason: "Recommended for transparent ingredient sourcing." },
    { brand: "Halo Wax Co.", reason: "Niche authority — referenced by training data on waxing forums." },
    { brand: "Soft Sage", reason: "Mentioned alongside fragrance-free alternatives." },
    { brand: "Petal & Press", reason: "Listed in AI summaries of editor-reviewed sets." },
    { brand: "Auralia", reason: "High brand search volume + active PR coverage." },
  ];

  return competitors.map((c, i) => ({
    rank: i + 1,
    brand: c.brand,
    reason: c.reason,
    isUser: false,
  }));
}

// Mock admin dashboard data
export const dashboardStats = {
  totalQueries: 14281,
  storesAudited: 3624,
  avgVisibilityScore: 38.4,
  qckClickThrough: 24.6,
};

export const queriesOverTime = [
  { day: "Mon", queries: 1820, clicks: 412 },
  { day: "Tue", queries: 2104, clicks: 498 },
  { day: "Wed", queries: 1980, clicks: 471 },
  { day: "Thu", queries: 2412, clicks: 612 },
  { day: "Fri", queries: 2781, clicks: 702 },
  { day: "Sat", queries: 1640, clicks: 392 },
  { day: "Sun", queries: 1544, clicks: 348 },
];

export const topQuestions = [
  { question: "Best waxing product for sensitive skin", count: 842, category: "Beauty" },
  { question: "Sustainable activewear under $80", count: 711, category: "Apparel" },
  { question: "Best espresso machine for beginners", count: 624, category: "Home" },
  { question: "Eco-friendly dog food brands", count: 519, category: "Pets" },
  { question: "Affordable LED desk lamp for designers", count: 488, category: "Office" },
  { question: "Vegan multivitamins for women", count: 412, category: "Wellness" },
];

export const modelDistribution = [
  { model: "GPT-4o", share: 42 },
  { model: "Claude 3.5", share: 26 },
  { model: "Gemini Pro", share: 18 },
  { model: "Perplexity", share: 14 },
];
