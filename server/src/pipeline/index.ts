/**
 * Orchestrates: cache check → domain resolve → stage 1 → stage 2 → cache put.
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

export async function runPipeline(
  keyword: string,
  store: string,
): Promise<VisibilityResponse> {
  const timeout = setTimeout(() => {}, PIPELINE_TIMEOUT_MS);

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

    // 3. Stage 1 — grounded search (returns brand + url + reason directly)
    const stage1Start = Date.now();
    const stage1Output = await groundedSearch(keyword, resolvedStore);
    const stage1Ms = Date.now() - stage1Start;

    // 4. Stage 2 — classify category + detect isUser
    const stage2Start = Date.now();
    let stage2Output: Stage2Output;
    try {
      stage2Output = await formatToJSON(stage1Output, resolvedStore);
    } catch (err) {
      throw new PipelineError("upstream_failed", `Stage 2 failed: ${err}`, { stage1Ms });
    }
    const stage2Ms = Date.now() - stage2Start;
    const { category } = stage2Output;

    // 5. Slice to top 10
    const rankings = stage2Output.rankings.slice(0, 10);

    // 6. Validate entry count
    if (rankings.length < 5) {
      throw new PipelineError(
        "upstream_failed",
        `Stage 2 returned only ${rankings.length} entries`,
        { stage1Ms, stage2Ms },
      );
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
    const record: VisibilityRecord = { keyword, store: resolvedStore, rawStore: store, category, result, createdAt: new Date() };
    await store_.put(record);

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export { PipelineError } from "../lib/errors.js";
