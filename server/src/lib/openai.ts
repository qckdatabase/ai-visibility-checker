import OpenAI from "openai";
import { getEnv } from "./env.js";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) return client;
  const env = getEnv();
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}
