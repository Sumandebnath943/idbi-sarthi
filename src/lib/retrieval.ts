// Hybrid retrieval for the RAG Knowledge Base.
//
// Combines two ranking signals over the chunk store and fuses them with
// Reciprocal Rank Fusion (RRF):
//   1. Semantic — cosine similarity on local embeddings (catches paraphrases).
//   2. Keyword  — token-overlap TF scoring (catches exact IDs / rare terms).
// RRF is order-based, so the two scores don't need to be on the same scale.
//
// If the embedding model is unavailable (offline / first-run download blocked),
// retrieval degrades gracefully to keyword-only so the feature still works.

import { embed } from "./embeddings";
import { ensureSeeded } from "./ingest";
import { vectorStore, type Chunk } from "./vectors";

const RRF_K = 60;

export type RetrievedChunk = {
  chunk: Chunk;
  score: number;         // fused RRF score
  vectorRank?: number;   // 1-based, if it appeared in the semantic list
  keywordRank?: number;  // 1-based, if it appeared in the keyword list
  semantic: boolean;     // whether embeddings contributed (false = keyword-only fallback)
};

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/** TF-style keyword score of a chunk against query tokens (title-weighted). */
function keywordScore(chunk: Chunk, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const body = chunk.text.toLowerCase();
  const title = chunk.docTitle.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (title.includes(t)) score += 3;
    // count body occurrences (capped to avoid a single long chunk dominating)
    let idx = body.indexOf(t);
    let hits = 0;
    while (idx >= 0 && hits < 5) {
      score += 1;
      hits++;
      idx = body.indexOf(t, idx + t.length);
    }
  }
  return score;
}

async function keywordRank(query: string): Promise<Chunk[]> {
  const tokens = tokenize(query);
  const all = await vectorStore.all();
  return all
    .map((chunk) => ({ chunk, s: keywordScore(chunk, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.chunk);
}

async function semanticRank(query: string, k: number): Promise<Chunk[] | null> {
  try {
    const q = await embed(query);
    const hits = await vectorStore.query(q, k);
    return hits.map((h) => h.chunk);
  } catch (e) {
    console.error("Embedding/semantic retrieval failed, falling back to keyword:", e);
    return null; // signal fallback
  }
}

/**
 * Hybrid retrieval. Ensures the corpus is seeded, runs both arms, and fuses.
 * @param k number of chunks to return
 */
export async function hybridSearch(query: string, k = 6): Promise<RetrievedChunk[]> {
  await ensureSeeded();

  const pool = Math.max(k * 3, 12);
  const [semantic, keywordAll] = await Promise.all([semanticRank(query, pool), keywordRank(query)]);
  const keyword = keywordAll.slice(0, pool);

  const fused = new Map<string, RetrievedChunk>();

  const add = (chunk: Chunk, rank: number, kind: "vector" | "keyword") => {
    const existing = fused.get(chunk.id);
    const contribution = 1 / (RRF_K + rank);
    if (existing) {
      existing.score += contribution;
      if (kind === "vector") existing.vectorRank = rank + 1;
      else existing.keywordRank = rank + 1;
    } else {
      fused.set(chunk.id, {
        chunk,
        score: contribution,
        vectorRank: kind === "vector" ? rank + 1 : undefined,
        keywordRank: kind === "keyword" ? rank + 1 : undefined,
        semantic: semantic !== null,
      });
    }
  };

  if (semantic) semantic.forEach((c, i) => add(c, i, "vector"));
  keyword.forEach((c, i) => add(c, i, "keyword"));

  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
}
