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
  const text = block.type === "text" ? block.text : "";

  // Log truncation warning for debugging
  if (response.stop_reason === "max_tokens") {
    console.warn(
      `[llm-client] Response truncated (max_tokens). Model: ${options.model ?? "claude-3-haiku-20240307"}, maxTokens: ${options.maxTokens ?? 4096}`
    );
  }

  return text;
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

  cleaned = cleaned.trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // noop — fall through to repair
  }

  // Try jsonrepair (handles most malformed JSON)
  try {
    return JSON.parse(jsonrepair(cleaned)) as T;
  } catch {
    // noop — fall through to truncation handling
  }

  // Handle truncated JSON: find the last valid brace/bracket and close
  // This happens when the LLM hits max_tokens mid-output
  try {
    const truncated = repairTruncatedJson(cleaned);
    return JSON.parse(truncated) as T;
  } catch {
    // noop
  }

  // Last resort: try jsonrepair on the truncation-repaired version
  try {
    const truncated = repairTruncatedJson(cleaned);
    return JSON.parse(jsonrepair(truncated)) as T;
  } catch (e) {
    throw new Error(
      `Failed to parse LLM JSON output (${cleaned.length} chars). ` +
      `First 200 chars: ${cleaned.slice(0, 200)}... ` +
      `Last 200 chars: ...${cleaned.slice(-200)}. ` +
      `Parse error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Repair truncated JSON by closing any open structures.
 * When the LLM hits max_tokens, the JSON is cut off mid-stream.
 * This function counts open braces/brackets and closes them.
 */
function repairTruncatedJson(input: string): string {
  // Remove any trailing partial key/value (e.g., `"some_key": "partial val`)
  let s = input;

  // Remove trailing comma or colon
  s = s.replace(/[,:\s]+$/, "");

  // If we're inside an unclosed string, close it
  let inString = false;
  let lastQuoteIdx = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' && (i === 0 || s[i - 1] !== "\\")) {
      inString = !inString;
      if (inString) lastQuoteIdx = i;
    }
  }
  if (inString) {
    // Close the string
    s += '"';
  }

  // Count open structures
  const stack: string[] = [];
  inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && (i === 0 || s[i - 1] !== "\\")) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // Remove trailing comma before closing
  s = s.replace(/,\s*$/, "");

  // Close all open structures
  while (stack.length > 0) {
    s += stack.pop();
  }

  return s;
}
