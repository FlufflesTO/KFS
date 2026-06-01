/**
 * Project Sentinel - OpenRouter AI Service
 * Purpose: Wraps @openrouter/sdk for use inside Astro SSR endpoints and server-side code.
 * Dependencies: @openrouter/sdk, cloudflare:workers
 * Structural Role: AI integration layer — chat completion, structured output, agent workflows
 */

import { OpenRouter } from "@openrouter/sdk";
// @ts-ignore - cloudflare:workers module
import { env } from "cloudflare:workers";

function resolveBindings(): Record<string, unknown> {
  try {
    if (env && (env as any).OPENROUTER_API_KEY) return env as unknown as Record<string, unknown>;
  } catch { /* not in Cloudflare context */ }
  return (globalThis as any).__env__ || process?.env || {};
}

function getApiKey(): string {
  const bindings = resolveBindings();
  const key = String(bindings.OPENROUTER_API_KEY || "");
  if (!key || key.length < 10) {
    throw new Error("OPENROUTER_API_KEY is not configured. Add it to .dev.vars (local) or Cloudflare secrets (production).");
  }
  return key;
}

let _client: OpenRouter | null = null;

function client(): OpenRouter {
  if (!_client) {
    _client = new OpenRouter({ apiKey: getApiKey() });
  }
  return _client;
}

// ── Simple chat (non-streaming) ────────────────────────────────────────────

export interface ChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Send a prompt and get back a plain text response.
 * Default model is DeepSeek-V4-Pro (good balance of quality/cost for business workflows).
 */
export async function chat(
  userMessage: string,
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = "deepseek/deepseek-chat",
    systemPrompt,
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userMessage });

  const response = await client().chat.send({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content ?? "";
}

// ── Structured JSON output ─────────────────────────────────────────────────

/**
 * Ask for structured JSON output. Returns the parsed object.
 * Automatically appends a system instruction to output valid JSON.
 */
export async function structuredChat<T = Record<string, unknown>>(
  userMessage: string,
  options: ChatOptions = {}
): Promise<T> {
  const {
    model = "deepseek/deepseek-chat",
    temperature = 0.1, // lower temp for structured output
    maxTokens = 4096,
  } = options;

  const systemPrompt = [
    options.systemPrompt,
    "You must respond with valid JSON only. No markdown, no code fences, no explanatory text — just the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  const text = await chat(userMessage, { model, systemPrompt, temperature, maxTokens });

  // Strip code fences if the model ignores instructions
  const cleaned = text.replace(/```(?:json)?\s*/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ── Streaming chat ─────────────────────────────────────────────────────────

/**
 * Stream a chat response token by token.
 * Pass an onToken callback to receive each chunk as it arrives.
 */
export async function streamChat(
  userMessage: string,
  onToken: (token: string) => void,
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = "deepseek/deepseek-chat",
    systemPrompt,
    temperature = 0.5,
    maxTokens = 2048,
  } = options;

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userMessage });

  const stream = await client().chat.send({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      onToken(delta);
    }
  }
  return full;
}
