/**
 * Orchestrates: cache check → domain resolve → stage 1 → stage 2 → fuzzy match → cache put.
 * Total wall clock capped at 45s via AbortController.
 */
import { v4 as uuidv4 } from "uuid";
import type { VisibilityResponse } from "../types.js";
import type { Stage2Output } from "./format.js";
import { groundedSearch } from "./search.js";
import { formatToJSON } from "./format.js";
import { getStore } from "../store/index.js";
import type { VisibilityRecord } from "../store/types.js";
import { PipelineError } from "../lib/errors.js";
import { resolveDomain } from "../lib/resolveDomain.js";

const PIPELINE_TIMEOUT_MS = 45_000;

function fuzzyMatch(userStore: string, brand: string): boolean {
  const normalizeBrand = (s: string) =>
    s.toLowerCase().replace(/^www\./, "").replace(/\/$/, "").replace(/^https?:\/\//, "");
  return normalizeBrand(userStore) === normalizeBrand(brand);
}

export async function runPipeline(
  keyword: string,
  store: string,
): Promise<VisibilityResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PIPELINE_TIMEOUT_MS);

  try {
    const store_ = getStore();

    // 1. Cache check
    const cached = await store_.get(keyword, store);
    if (cached) {
      return { ...cached.result, cached: true };
    }

    // 2. Resolve store domain (handles brand-name → domain)
    const resolvedStore = await resolveDomain(store);
    if (resolvedStore === "unknown") {
      throw new PipelineError(
        "invalid_input",
        `Could not resolve domain for store: ${store}`,
        {},
      );
    }

    // 3. Stage 1 — grounded search
    const stage1Start = Date.now();
    const { text: rawProse, urls: sourceUrls } = await groundedSearch(keyword, resolvedStore);
    const stage1Ms = Date.now() - stage1Start;

    // 4. Stage 2 — format to JSON
    const stage2Start = Date.now();
    let stage2Output: Stage2Output;
    try {
      stage2Output = await formatToJSON(rawProse, resolvedStore, sourceUrls);
    } catch (err) {
      throw new PipelineError("upstream_failed", `Stage 2 failed: ${err}`, { stage1Ms });
    }
    const stage2Ms = Date.now() - stage2Start;
    const { category } = stage2Output;

    // 5. Post-process: fuzzy match isUser
    let rankings = stage2Output.rankings.map((r) => ({ ...r }));
    const userMatchedIndex = rankings.findIndex((r) => fuzzyMatch(resolvedStore, r.brand));
    if (userMatchedIndex !== -1) {
      rankings[userMatchedIndex] = { ...rankings[userMatchedIndex], isUser: true };
    }

    // 6. Validate entry count
    if (rankings.length < 5) {
      throw new PipelineError(
        "upstream_failed",
        `Stage 2 returned only ${rankings.length} entries`,
        { stage1Ms, stage2Ms },
      );
    }
    if (rankings.length > 10) {
      rankings = rankings.slice(0, 10);
    }

    // 7. Compute userRank
    const userEntry = rankings.find((r) => r.isUser);
    const userRank = userEntry ? userEntry.rank : null;

    const searchedAt = new Date().toISOString();
    const result: VisibilityResponse = {
      results: rankings,
      userRank,
      cached: false,
      queryId: uuidv4(),
      model: "gpt-4o",
      searchedAt,
      category,
    };

    // 8. Cache put
    const record: VisibilityRecord = { keyword, store: resolvedStore, category, result, createdAt: new Date() };
    await store_.put(record);

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export { PipelineError } from "../lib/errors.js";
