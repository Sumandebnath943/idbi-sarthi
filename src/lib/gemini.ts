// Google Gemini provider (REST, no SDK — mirrors the Groq client style).
//
// Used for chat, RAG generation, Document-Intelligence vision, and embeddings.
// The blueprint calls for Gemini; this makes it the primary provider when
// GEMINI_API_KEY is set (Groq remains the fallback via src/lib/llm.ts).

import type { GroqMessage } from "./groq";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
// gemini-flash-lite-latest has free-tier quota (gemini-2.0-flash is billing-only:
// "limit: 0" on free tier). Override with GEMINI_MODEL once billing is enabled.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
// Gemini vision is the same multimodal flash model — kept separate for override.
export const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL ?? GEMINI_MODEL;
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
// gemini-embedding-001 defaults to 3072-dim; we request 768 (Matryoshka
// truncation) to match the Supabase vector(768) column. Override via env if you
// change the SQL column width.
export const GEMINI_EMBED_DIM = Number(process.env.GEMINI_EMBED_DIM ?? "768");

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export function geminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

function parseDataUrl(url: string): { mime: string; data: string } | null {
  const m = url.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return null;
  return { mime: m[1], data: m[2] };
}

function toGeminiParts(content: GroqMessage["content"]): GeminiPart[] {
  if (typeof content === "string") return [{ text: content }];
  const parts: GeminiPart[] = [];
  for (const p of content) {
    if (p.type === "text") parts.push({ text: p.text });
    else if (p.type === "image_url") {
      const parsed = parseDataUrl(p.image_url.url);
      if (parsed) parts.push({ inline_data: { mime_type: parsed.mime, data: parsed.data } });
    }
  }
  return parts;
}

export type GeminiOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
};

/** Chat/vision completion via Gemini generateContent. Returns assistant text. */
export async function geminiChat(messages: GroqMessage[], opts: GeminiOptions = {}): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemMsgs = messages.filter((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    contents: turns.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: toGeminiParts(m.content),
    })),
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 800,
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemMsgs.length > 0) {
    body.system_instruction = { parts: systemMsgs.flatMap((m) => toGeminiParts(m.content)) };
  }

  const model = opts.model ?? GEMINI_MODEL;
  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const reply = Array.isArray(parts) ? parts.map((p: { text?: string }) => p.text ?? "").join("") : "";
  if (!reply) throw new Error("Empty reply from Gemini");
  return reply;
}

async function embedOne(text: string): Promise<number[]> {
  const res = await fetch(`${BASE}/models/${GEMINI_EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text: text.replace(/\s+/g, " ").trim() || " " }] },
      outputDimensionality: GEMINI_EMBED_DIM,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini embed ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values)) throw new Error("Gemini embed: no values in response");
  // Truncated (<3072) embeddings are not unit-length — normalize so cosine == dot.
  return normalize(values);
}

/**
 * Embed texts → L2-normalized GEMINI_EMBED_DIM vectors.
 * gemini-embedding-001 has no synchronous batch endpoint, so we fan out
 * embedContent calls with a small concurrency cap to respect rate limits.
 */
export async function geminiEmbed(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  if (texts.length === 0) return [];

  const CONCURRENCY = 5;
  const out: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY);
    const vecs = await Promise.all(slice.map((t) => embedOne(t)));
    vecs.forEach((v, j) => (out[i + j] = v));
  }
  return out;
}

// Gemini embeddings are not guaranteed unit-length; normalize so cosine == dot,
// matching the local-embeddings path and the in-memory store's assumption.
function normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}
