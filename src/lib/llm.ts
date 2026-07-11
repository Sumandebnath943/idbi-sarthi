// Provider-agnostic LLM layer used by chat, RAG generation and Document
// Intelligence (text + vision). Both Groq and Gemini can do generation; only
// GEMINI does embeddings (see embeddings.ts) — Groq has no embeddings endpoint.
//
// Default priority: GROQ → Gemini. Groq's free tier is more generous and its
// models (llama-3.3-70b / llama-4-scout vision) are stronger than Gemini's
// free-tier flash-lite (gemini-2.0-flash is billing-only). Override the order
// with LLM_PROVIDER=groq|gemini.

import {
  GEMINI_MODEL, GEMINI_VISION_MODEL, geminiChat, geminiConfigured,
} from "./gemini";
import {
  GROQ_TEXT_MODEL, GROQ_VISION_MODEL, groqChat, groqConfigured, type GroqMessage,
} from "./groq";

export type LlmMessage = GroqMessage;
export type Provider = "gemini" | "groq";

export type LlmOptions = {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export type LlmResult = { text: string; provider: Provider };

export function llmConfigured(): boolean {
  return geminiConfigured() || groqConfigured();
}

/**
 * Ordered list of configured providers to try (first = primary).
 * Text: Groq-first by default (gpt-oss-120b — production, fast). Vision: Gemini-
 * first always, because Groq has no production vision model (llama-4-scout is
 * preview/deprecated). LLM_PROVIDER=gemini flips the text order.
 */
function providerOrder(vision: boolean): Provider[] {
  const pref = process.env.LLM_PROVIDER?.toLowerCase();
  const avail: Record<Provider, boolean> = { groq: groqConfigured(), gemini: geminiConfigured() };
  const base: Provider[] = vision
    ? ["gemini", "groq"]
    : pref === "gemini"
      ? ["gemini", "groq"]
      : ["groq", "gemini"];
  return base.filter((p) => avail[p]);
}

/** Text provider that will be used first, for status reporting. */
export function activeLlmProvider(): Provider | "none" {
  return providerOrder(false)[0] ?? "none";
}

function hasImage(messages: LlmMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image_url")
  );
}

async function callProvider(
  provider: Provider,
  messages: LlmMessage[],
  vision: boolean,
  opts: LlmOptions
): Promise<string> {
  if (provider === "groq") {
    return groqChat(messages, {
      model: vision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      jsonMode: opts.jsonMode,
    });
  }
  return geminiChat(messages, {
    model: vision ? GEMINI_VISION_MODEL : GEMINI_MODEL,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    jsonMode: opts.jsonMode,
  });
}

/**
 * Complete a chat/vision request, trying each configured provider in order.
 * Throws only if every provider fails (or none is configured).
 */
export async function llmComplete(messages: LlmMessage[], opts: LlmOptions = {}): Promise<LlmResult> {
  const vision = hasImage(messages);
  const order = providerOrder(vision);
  if (order.length === 0) throw new Error("No LLM provider configured");

  const errors: string[] = [];
  for (const provider of order) {
    try {
      const text = await callProvider(provider, messages, vision, opts);
      return { text, provider };
    } catch (e) {
      errors.push(`${provider}: ${(e as Error).message}`);
    }
  }
  throw new Error(`All LLM providers failed — ${errors.join("; ")}`);
}
