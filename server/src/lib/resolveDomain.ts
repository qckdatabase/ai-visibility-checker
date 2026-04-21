import { getOpenAIClient } from "./openai.js";

export async function resolveDomain(input: string): Promise<string> {
  const trimmed = (input ?? "").trim();
  if (trimmed.includes(".")) {
    return trimmed.toLowerCase();
  }
  if (!trimmed) {
    return "unknown";
  }
  try {
    const client = getOpenAIClient();
    const prompt = `Given the brand or store name '${trimmed}', return only its primary website domain (e.g. 'lumen-skin.com'). If you cannot determine it with reasonable confidence, return exactly 'unknown'. Do not include https:// or trailing slashes.`;
    const response = await client.responses.create({
      model: "gpt-4o",
      input: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_preview" }],
      max_output_tokens: 30,
    });
    const text = response?.output_text ?? "unknown";
    return String(text).trim().toLowerCase();
  } catch {
    return "unknown";
  }
}
