// Shared Groq (OpenAI-compatible) client for text + vision chat completions.
//
// Centralizes model ids, the endpoint, JSON-mode handling and error shaping so
// the chat, document-intelligence and RAG routes don't each re-implement fetch.

export const GROQ_API_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ENV ?? "";
// gpt-oss-120b is Groq's current production flagship (llama-3.3-70b-versatile is
// slated for deprecation). Override via GROQ_MODEL.
export const GROQ_TEXT_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
// NOTE: Groq has no production vision model — llama-4-scout is preview and
// deprecates 2026-07-17. Vision requests are routed to Gemini in llm.ts; this is
// only a last-resort if Gemini is unavailable. Override via GROQ_VISION_MODEL.
export const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export function groqConfigured(): boolean {
  return !!GROQ_API_KEY;
}

export type GroqTextPart = { type: "text"; text: string };
export type GroqImagePart = { type: "image_url"; image_url: { url: string } };
export type GroqContent = string | (GroqTextPart | GroqImagePart)[];
export type GroqMessage = { role: "system" | "user" | "assistant"; content: GroqContent };

export type GroqOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask Groq to constrain output to a single JSON object. */
  jsonMode?: boolean;
  signal?: AbortSignal;
};

/**
 * Call Groq chat completions and return the assistant text.
 * Throws on transport / non-2xx / empty-reply so callers can decide on fallback.
 */
export async function groqChat(messages: GroqMessage[], opts: GroqOptions = {}): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? GROQ_TEXT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 800,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Groq API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply) throw new Error("Empty reply from Groq");
  return reply;
}

/** Parse a JSON object out of an LLM reply, tolerating ```json fences / prose. */
export function parseJsonReply<T = unknown>(reply: string): T {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : reply;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const slice = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(slice) as T;
}
