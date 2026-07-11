// Ingestion pipeline: raw document text → chunks → embeddings → vector store.
//
// Used both to seed the built-in policy corpus at startup and to index
// user-uploaded policy files (POST /api/rag/ingest).

import { policies, type Policy } from "./data";
import { embedBatch } from "./embeddings";
import { vectorStore, type Chunk, type ChunkSource } from "./vectors";

// Target ~110 words per chunk with a 1-sentence overlap. The built-in policies
// are short (~100-140 words) so most become a single chunk; the windowing still
// matters for longer uploaded documents.
const TARGET_WORDS = 110;
const OVERLAP_SENTENCES = 1;

function estimateTokens(text: string): number {
  // Rough heuristic: ~1.3 tokens per whitespace-delimited word.
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split text into overlapping, roughly word-bounded chunks.
 * Returns the passage text plus a 1-based sentence-range label for citations.
 */
export function chunkText(text: string): { text: string; section: string }[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: { text: string; section: string }[] = [];
  let start = 0;
  while (start < sentences.length) {
    let end = start;
    let words = 0;
    while (end < sentences.length) {
      words += sentences[end].split(/\s+/).length;
      end++;
      if (words >= TARGET_WORDS) break;
    }
    chunks.push({
      text: sentences.slice(start, end).join(" "),
      section: start + 1 === end ? `sentence ${end}` : `sentences ${start + 1}-${end}`,
    });
    if (end >= sentences.length) break;
    start = Math.max(start + 1, end - OVERLAP_SENTENCES);
  }
  return chunks;
}

export type IngestInput = {
  docId: string;
  docTitle: string;
  text: string;
  source: ChunkSource;
  category?: string;
  page?: number;
};

/** Chunk + embed a document and upsert it into the vector store. */
export async function ingestDocument(input: IngestInput): Promise<{ docId: string; chunks: number }> {
  const pieces = chunkText(input.text);
  if (pieces.length === 0) return { docId: input.docId, chunks: 0 };

  const embeddings = await embedBatch(pieces.map((p) => p.text));
  const chunks: Chunk[] = pieces.map((p, i) => ({
    id: `${input.docId}#${i}`,
    docId: input.docId,
    docTitle: input.docTitle,
    source: input.source,
    category: input.category,
    section: p.section,
    page: input.page,
    text: p.text,
    tokens: estimateTokens(p.text),
    embedding: embeddings[i],
  }));
  await vectorStore.upsert(chunks);
  return { docId: input.docId, chunks: chunks.length };
}

function policyToInput(p: Policy): IngestInput {
  // Prepend title + summary so the passage carries its own topic context — helps
  // both keyword and semantic recall on short policy bodies.
  return {
    docId: p.id,
    docTitle: p.title,
    text: `${p.title}. ${p.summary} ${p.content}`,
    source: "policy",
    category: p.category,
  };
}

// Seed the built-in policy corpus exactly once per process. Memoized so
// concurrent first requests share a single embedding pass.
const g = globalThis as unknown as { __idbiSeed?: Promise<void> };

export function ensureSeeded(): Promise<void> {
  if (g.__idbiSeed) return g.__idbiSeed;
  g.__idbiSeed = (async () => {
    for (const p of policies) {
      if (!(await vectorStore.hasDoc(p.id))) {
        await ingestDocument(policyToInput(p));
      }
    }
  })();
  return g.__idbiSeed;
}
