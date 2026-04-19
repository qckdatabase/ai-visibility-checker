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
