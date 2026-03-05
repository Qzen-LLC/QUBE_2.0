import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import { SYSTEM_PROMPT } from "../prompts/enrichment";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return clientInstance;
}

export async function callLLM(
  prompt: string,
  options: { maxTokens?: number; model?: string; system?: string } = {}
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: options.model ?? "claude-3-haiku-20240307",
    max_tokens: options.maxTokens ?? 4096,
    system: options.system ?? SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

export async function callLLMJson<T = Record<string, unknown>>(
  prompt: string,
  options: { maxTokens?: number; model?: string; system?: string } = {}
): Promise<T> {
  const raw = await callLLM(prompt, options);
  return parseJsonFromLLM<T>(raw);
}

export function parseJsonFromLLM<T = Record<string, unknown>>(raw: string): T {
  let cleaned = raw;
  if (cleaned.includes("```json")) {
    cleaned = cleaned.split("```json")[1].split("```")[0];
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.split("```")[1].split("```")[0];
  } else {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
  }

  try {
    return JSON.parse(cleaned.trim()) as T;
  } catch {
    return JSON.parse(jsonrepair(cleaned.trim())) as T;
  }
}
