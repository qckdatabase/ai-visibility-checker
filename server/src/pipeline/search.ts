/**
 * Stage 1 — grounded search.
 * Calls GPT-4o Responses API with web_search_preview tool.
 * Returns structured JSON with brand, url, and reason — no fuzzy matching needed in stage 2.
 */
import { getOpenAIClient } from "../lib/openai.js";

const STAGE1_SCHEMA = {
  type: "object",
  properties: {
    rankings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          brand: { type: "string" },
          reason: { type: "string" },
          url: { type: "string", description: "The source URL cited for this recommendation, or empty string if no URL was found" },
        },
        required: ["rank", "brand", "reason", "url"],
        additionalProperties: false,
      },
    },
  },
  required: ["rankings"],
  additionalProperties: false,
} as const;

export interface Stage1Output {
  rankings: Array<{ rank: number; brand: string; reason: string; url: string }>;
}

export async function groundedSearch(keyword: string, store: string): Promise<Stage1Output> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content:
          `You are an e-commerce discovery assistant. Given a shopper's query, use web search to identify the top ~10 online stores or brands a shopper would be recommended today. Consider whether the user's own store appears in this set.\n` +
          `For each recommended brand, you MUST include the actual source URL from the web search results as the "url" field — do not leave it empty unless no URL was available from the search.\n` +
          `If the user's store "${store}" belongs in the top 10, include it at the appropriate rank.\n` +
          `Return ONLY valid JSON matching the schema.`,
      },
      { role: "user", content: `Shopper query: "${keyword}"\nUser's store: "${store}"` },
    ],
    tools: [{ type: "web_search_preview" }],
    text: {
      format: {
        name: "rankings",
        schema: STAGE1_SCHEMA as Record<string, unknown>,
        type: "json_schema",
      },
    },
    max_output_tokens: 4096,
  });

  const text = response.output_text ?? "";
  try {
    const parsed = JSON.parse(text) as Stage1Output;
    return parsed;
  } catch {
    throw new Error(`Stage 1 parse failed: ${text.slice(0, 200)}`);
  }
}
