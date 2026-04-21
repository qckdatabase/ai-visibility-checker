/**
 * Stage 2 — format to structured JSON.
 * Second GPT-4o call, no tools, json_schema output.
 * Parses the raw prose from stage 1 into AiRanking[].
 */
import { getOpenAIClient } from "../lib/openai.js";

const VALID_CATEGORIES = [
  "Beauty", "Apparel", "Home", "Wellness", "Office", "Food", "Pets", "Sports", "Kids", "Electronics", "Other",
] as const;

const FORMAT_SCHEMA = {
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
          url: { type: "string" },
          isUser: { type: "boolean" },
        },
        required: ["rank", "brand", "reason", "url", "isUser"],
        additionalProperties: false,
      },
    },
    category: {
      type: "string",
      description: `The industry category of the keyword. Must be one of: ${VALID_CATEGORIES.join(", ")}.`,
    },
  },
  required: ["rankings", "category"],
  additionalProperties: false,
} as const;

export type Stage2Output = {
  rankings: Array<{ rank: number; brand: string; reason: string; url: string; isUser: boolean }>;
  category: (typeof VALID_CATEGORIES)[number];
};

export async function formatToJSON(
  rawProse: string,
  userStore: string,
  sourceUrls: Map<string, string>,
): Promise<Stage2Output> {
  const client = getOpenAIClient();

  const urlsList =
    sourceUrls.size > 0
      ? "Source URLs from web search:\n" +
        Array.from(sourceUrls.entries())
          .map(([name, url]) => `  - ${name}: ${url}`)
          .join("\n")
      : "No source URLs available.";

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content:
          "You are a JSON extractor. Extract the ranked list from the following text as structured JSON.\n" +
          `If the user's store "${userStore}" appears, set isUser: true on that entry.\n` +
          `For each brand, try to find its source URL from the URL list below and include it as "url". ` +
          "If no URL matches, use an empty string for url.\n" +
          `Also classify the keyword's industry category from these options: ${VALID_CATEGORIES.join(", ")}.` +
          " Return ONLY valid JSON matching the schema.\n\n" +
          urlsList,
      },
      { role: "user", content: rawProse },
    ],
    text: {
      format: {
        name: "rankings",
        schema: FORMAT_SCHEMA as Record<string, unknown>,
        type: "json_schema",
      },
    },
    max_output_tokens: 2048,
  });

  const text = response.output_text ?? "";
  try {
    return JSON.parse(text) as Stage2Output;
  } catch {
    throw new Error(`Stage 2 JSON parse failed: ${text.slice(0, 200)}`);
  }
}
