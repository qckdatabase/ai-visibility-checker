/**
 * Stage 1 — grounded search.
 * Calls GPT-4o Responses API with web_search tool.
 * Returns raw prose string (passed as-is to stage 2).
 */
import { getOpenAIClient } from "../lib/openai.js";

const SYSTEM_PROMPT = `You are an e-commerce discovery assistant. Given a shopper's query, use web search to identify the top ~10 online stores or brands a shopper would be recommended today. Consider whether the user's own store appears in this set.

User: Shopper query: "{keyword}"
       User's store: "{store}"
       Return: a ranked list of the 10 most recommended stores/brands,
       each with a one-sentence reason, citing web sources where relevant.
       If the user's store belongs in the top 10, include it at the
       appropriate rank and say so.`;

export async function groundedSearch(keyword: string, store: string): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: SYSTEM_PROMPT.replace("{keyword}", keyword).replace("{store}", store) },
      { role: "user", content: `Shopper query: "${keyword}"\nUser's store: "${store}"` },
    ],
    tools: [{ type: "web_search_preview" }],
    max_tokens: 4096,
  });

  return response.output_text ?? "";
}
