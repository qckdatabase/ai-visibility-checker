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

