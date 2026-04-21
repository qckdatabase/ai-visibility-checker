import { getOpenAIClient } from "./openai.js";

const DOMAIN_RESOLUTION_PROMPT = (input: string) =>
  `Given the brand or store name '${input}', return only its primary website domain ` +
  `(e.g. 'lumen-skin.com'). If you cannot determine it with reasonable confidence, ` +
  `return exactly 'unknown'. Do not include https:// or trailing slashes.`;

export async function resolveDomain(input: string): Promise<string> {
  const trimmed = input.trim();
  // If it looks like a domain already, return it unchanged
  if (trimmed.includes(".")) return trimmed.toLowerCase();

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: "gpt-4o",
      input: [{ role: "user", content: DOMAIN_RESOLUTION_PROMPT(trimmed) }],
      tools: [{ type: "web_search_preview" }],
      max_output_tokens: 30,
    });

    const text = (response.output_text ?? "unknown").trim().toLowerCase();
    // Accept only results that look like domains (have a dot)
    return text === "unknown" || !text.includes(".") ? "unknown" : text;
  } catch {
    return "unknown";
  }
}
