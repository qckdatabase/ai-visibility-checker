// Canonical shape returned inside `results[]`. Mirrors the frontend's
// AiRanking type defined in src/components/landing/ResultsSidebar.tsx.
// Do NOT diverge from that shape without updating the frontend too.
export type AiRanking = {
  rank: number;
  brand: string;
  reason: string;
  url: string;
  isUser: boolean;
};

export type VisibilityResponse = {
  results: AiRanking[];    // exactly 10 entries
  userRank: number | null; // rank of user's store if found, else null
  cached: boolean;
  queryId: string;
  model: "gpt-4o";
  searchedAt: string;      // ISO timestamp
  category: string;
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
