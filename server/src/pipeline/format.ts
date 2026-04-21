/**
 * Stage 2 — category classification + isUser flag.
 * Second GPT-4o call, no tools, json_schema output.
 * Takes structured rankings from stage 1 and adds category + isUser.
 */
import { getOpenAIClient } from "../lib/openai.js";
import type { Stage1Output } from "./search.js";

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
  stage1Output: Stage1Output,
  userStore: string,
): Promise<Stage2Output> {
  const client = getOpenAIClient();

  const rankingsText = JSON.stringify(stage1Output.rankings, null, 2);

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content:
          "You are a JSON processor. Take the ranked brand list below (which already has rank, brand, reason, and url from a web search) and produce updated JSON with two additions:\n" +
          `1. Set isUser: true on the entry where brand matches the user's store "${userStore}" (fuzzy match on brand name is fine).\n` +
          `2. Classify the keyword's industry category from these options: ${VALID_CATEGORIES.join(", ")}.\n` +
          "Return ONLY valid JSON matching the schema. Preserve all existing url values — do not overwrite them with empty strings.\n",
      },
      {
        role: "user",
        content: `Ranked brands from web search:\n${rankingsText}`,
      },
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
