// Text embeddings with a pluggable provider.
//
//   - "gemini" (default when GEMINI_API_KEY is set): hosted text-embedding-004
//     (768-dim). No native deps → the right choice for Vercel/serverless.
//   - "local"  (fallback / offline dev): transformers.js all-MiniLM-L6-v2
//     (384-dim). Downloads ~90 MB once; needs the Node runtime (onnxruntime-node).
//
// Override with EMBEDDINGS_PROVIDER=gemini|local. The active dimension must match
// the vector store's column width (see src/lib/vectors.ts / supabase/schema.sql).

import path from "node:path";
import { GEMINI_EMBED_DIM, geminiConfigured, geminiEmbed } from "./gemini";

const LOCAL_MODEL_ID = process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";
const LOCAL_DIM = 384;

export type EmbeddingProvider = "gemini" | "local";

export function embeddingProvider(): EmbeddingProvider {
  const override = process.env.EMBEDDINGS_PROVIDER?.toLowerCase();
  if (override === "gemini") return "gemini";
  if (override === "local") return "local";
  return geminiConfigured() ? "gemini" : "local";
}

/** Vector dimension of the active provider. */
export function embeddingDim(): number {
  return embeddingProvider() === "gemini" ? GEMINI_EMBED_DIM : LOCAL_DIM;
}

// ---- Local (transformers.js) pipeline: built once, cached (also on globalThis
// to survive dev HMR). ----
type Extractor = (
  input: string | string[],
  opts: { pooling: "mean"; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>;

const g = globalThis as unknown as { __idbiEmbedder?: Promise<Extractor> };

async function getLocalExtractor(): Promise<Extractor> {
  if (g.__idbiEmbedder) return g.__idbiEmbedder;
  g.__idbiEmbedder = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.cacheDir = path.join(process.cwd(), ".cache", "transformers");
    env.allowLocalModels = true;
    return (await pipeline("feature-extraction", LOCAL_MODEL_ID)) as unknown as Extractor;
  })();
  return g.__idbiEmbedder;
}

async function localEmbedBatch(texts: string[]): Promise<number[][]> {
  const extractor = await getLocalExtractor();
  const output = await extractor(
    texts.map((t) => t.replace(/\s+/g, " ").trim() || " "),
    { pooling: "mean", normalize: true }
  );
  return output.tolist();
}

/** Embed a single string → L2-normalized vector (dimension = embeddingDim()). */
export async function embed(text: string): Promise<number[]> {
  const [vec] = await embedBatch([text]);
  return vec;
}

/** Embed many strings in one pass. Returns L2-normalized vectors. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return embeddingProvider() === "gemini" ? geminiEmbed(texts) : localEmbedBatch(texts);
}

/** Warm the local model so the first request isn't a cold load. No-op for Gemini. */
export async function warmEmbeddings(): Promise<void> {
  if (embeddingProvider() === "local") await embed("warmup");
}
