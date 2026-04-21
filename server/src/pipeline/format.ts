/**
 * Stage 2 — format to structured JSON.
 * Second GPT-4o call, no tools, json_schema output.
 * Parses the raw prose from stage 1 into AiRanking[].
 */
import { getOpenAIClient } from "../lib/openai.js";

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
          isUser: { type: "boolean" },
        },
        required: ["rank", "brand", "reason", "isUser"],
      },
    },
  },
  required: ["rankings"],
  additionalProperties: false,
} as const;

export type Stage2Output = {
  rankings: Array<{ rank: number; brand: string; reason: string; isUser: boolean }>;
};

export async function formatToJSON(rawProse: string, userStore: string): Promise<Stage2Output> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      {
        role: "system",
        content:
          "You are a JSON extractor. Extract the ranked list from the following text as structured JSON. " +
          `If the user's store "${userStore}" appears, set isUser: true on that entry. ` +
          "Return ONLY valid JSON matching the schema.",
      },
      { role: "user", content: rawProse },
    ],
    response_format: {
      type: "json_schema",
      json_schema: FORMAT_SCHEMA,
    },
    max_tokens: 2048,
  });

  const text = response.output_text ?? "";
  try {
    return JSON.parse(text) as Stage2Output;
  } catch {
    throw new Error(`Stage 2 JSON parse failed: ${text.slice(0, 200)}`);
  }
}
