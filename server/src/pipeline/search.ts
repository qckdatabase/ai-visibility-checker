/**
 * Stage 1 — grounded search.
 * Calls GPT-4o Responses API with web_search tool.
 * Returns raw prose string and a map of source URLs found during the search.
 */
import { getOpenAIClient } from "../lib/openai.js";

const SYSTEM_PROMPT = `You are an e-commerce discovery assistant. Given a shopper's query, use web search to identify the top ~10 online stores or brands a shopper would be recommended today. Consider whether the user's own store appears in this set.

User: Shopper query: "{keyword}"
       User's store: "{store}"
       Return: a ranked list of the 10 most recommended stores/brands,
       each with a one-sentence reason, citing web sources where relevant.
       If the user's store belongs in the top 10, include it at the
       appropriate rank and say so.`;

export interface SourceUrlMap {
  text: string;
  urls: Map<string, string>; // brand name → url
}

function extractSourceUrls(response: unknown): Map<string, string> {
  const urlMap = new Map<string, string>();
  const resp = response as Record<string, unknown>;
  const items = (resp.output_items as unknown as Array<Record<string, unknown>>) ?? [];
  for (const item of items) {
    if (item.type !== "message") continue;
    const contentArr = (item.content as Array<Record<string, unknown>>) ?? [];
    for (const content of contentArr) {
      const annotations = content.annotations as Array<Record<string, unknown>> | undefined;
      if (annotations) {
        for (const ann of annotations) {
          if (ann.type === "url_citation" && ann.url) {
            const title = (ann.title as string | undefined) ?? (ann.url as string);
            if (!urlMap.has(title)) {
              urlMap.set(title, ann.url as string);
            }
          }
        }
      }
    }
  }
  return urlMap;
}

export async function groundedSearch(keyword: string, store: string): Promise<SourceUrlMap> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: SYSTEM_PROMPT.replace("{keyword}", keyword).replace("{store}", store) },
      { role: "user", content: `Shopper query: "${keyword}"\nUser's store: "${store}"` },
    ],
    tools: [{ type: "web_search_preview" }],
    max_output_tokens: 4096,
  });

  const text = response.output_text ?? "";
  const urls = extractSourceUrls(response);
  return { text, urls };
}
