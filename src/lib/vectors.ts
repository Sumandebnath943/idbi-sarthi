// Vector store abstraction for the RAG Knowledge Base.
//
// The `VectorStore` interface has two implementations:
//   - InMemoryVectorStore — cosine scan over an array. Default for local dev.
//   - SupabaseVectorStore  — pgvector via a `match_chunks` RPC. For Vercel/prod,
//     it persists across serverless invocations (the in-memory store cannot).
//
// Selection is by env (see makeStore). All methods are async so the two backends
// share one interface — Supabase can't answer synchronously.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ChunkSource = "policy" | "upload";

export type Chunk = {
  id: string;            // stable per-chunk id, e.g. "POL-001#2"
  docId: string;         // parent document id, e.g. "POL-001"
  docTitle: string;
  source: ChunkSource;
  category?: string;
  section?: string;
  page?: number;
  text: string;
  tokens: number;
  embedding: number[];   // L2-normalized, so cosine similarity == dot product
};

export type ScoredChunk = { chunk: Chunk; score: number };

export interface VectorStore {
  upsert(chunks: Chunk[]): Promise<void>;
  query(embedding: number[], k: number): Promise<ScoredChunk[]>;
  /** All chunks — used by the keyword arm of hybrid retrieval. */
  all(): Promise<Chunk[]>;
  hasDoc(docId: string): Promise<boolean>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

// ---- In-memory (dev / offline) ----
export class InMemoryVectorStore implements VectorStore {
  private chunks = new Map<string, Chunk>();
  private docs = new Set<string>();

  async upsert(chunks: Chunk[]): Promise<void> {
    for (const c of chunks) {
      this.chunks.set(c.id, c);
      this.docs.add(c.docId);
    }
  }

  async query(embedding: number[], k: number): Promise<ScoredChunk[]> {
    const scored: ScoredChunk[] = [];
    for (const chunk of this.chunks.values()) {
      scored.push({ chunk, score: dot(embedding, chunk.embedding) });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  async all(): Promise<Chunk[]> {
    return [...this.chunks.values()];
  }

  async hasDoc(docId: string): Promise<boolean> {
    return this.docs.has(docId);
  }

  async size(): Promise<number> {
    return this.chunks.size;
  }

  async clear(): Promise<void> {
    this.chunks.clear();
    this.docs.clear();
  }
}

// ---- Supabase pgvector (prod) ----
type Row = {
  id: string; doc_id: string; doc_title: string; source: string;
  category: string | null; section: string | null; page: number | null;
  content: string; tokens: number | null; score?: number;
};

function rowToChunk(r: Row, embedding: number[]): Chunk {
  return {
    id: r.id, docId: r.doc_id, docTitle: r.doc_title, source: r.source as ChunkSource,
    category: r.category ?? undefined, section: r.section ?? undefined,
    page: r.page ?? undefined, text: r.content, tokens: r.tokens ?? 0, embedding,
  };
}

export class SupabaseVectorStore implements VectorStore {
  private clientPromise: Promise<SupabaseClient> | null = null;
  constructor(private url: string, private key: string) {}

  private client(): Promise<SupabaseClient> {
    if (!this.clientPromise) {
      this.clientPromise = import("@supabase/supabase-js").then((m) =>
        m.createClient(this.url, this.key, { auth: { persistSession: false } })
      );
    }
    return this.clientPromise;
  }

  async upsert(chunks: Chunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const c = await this.client();
    const rows = chunks.map((ch) => ({
      id: ch.id, doc_id: ch.docId, doc_title: ch.docTitle, source: ch.source,
      category: ch.category ?? null, section: ch.section ?? null, page: ch.page ?? null,
      content: ch.text, tokens: ch.tokens, embedding: ch.embedding,
    }));
    const { error } = await c.from("rag_chunks").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Supabase upsert: ${error.message}`);
  }

  async query(embedding: number[], k: number): Promise<ScoredChunk[]> {
    const c = await this.client();
    const { data, error } = await c.rpc("match_chunks", { query_embedding: embedding, match_count: k });
    if (error) throw new Error(`Supabase match_chunks: ${error.message}`);
    return (data as Row[] ?? []).map((r) => ({ chunk: rowToChunk(r, []), score: r.score ?? 0 }));
  }

  async all(): Promise<Chunk[]> {
    // Embeddings omitted — the keyword arm only needs text/title/ids.
    const c = await this.client();
    const { data, error } = await c
      .from("rag_chunks")
      .select("id,doc_id,doc_title,source,category,section,page,content,tokens");
    if (error) throw new Error(`Supabase all: ${error.message}`);
    return (data as Row[] ?? []).map((r) => rowToChunk(r, []));
  }

  async hasDoc(docId: string): Promise<boolean> {
    const c = await this.client();
    const { count, error } = await c
      .from("rag_chunks")
      .select("id", { count: "exact", head: true })
      .eq("doc_id", docId);
    if (error) throw new Error(`Supabase hasDoc: ${error.message}`);
    return (count ?? 0) > 0;
  }

  async size(): Promise<number> {
    const c = await this.client();
    const { count, error } = await c.from("rag_chunks").select("id", { count: "exact", head: true });
    if (error) throw new Error(`Supabase size: ${error.message}`);
    return count ?? 0;
  }

  async clear(): Promise<void> {
    const c = await this.client();
    const { error } = await c.from("rag_chunks").delete().neq("id", "");
    if (error) throw new Error(`Supabase clear: ${error.message}`);
  }
}

// ---- Selection ----
export function vectorBackend(): "supabase" | "memory" {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const override = process.env.VECTOR_STORE?.toLowerCase();
  if (override === "memory") return "memory";
  if (override === "supabase") return "supabase";
  return url && key ? "supabase" : "memory";
}

function makeStore(): VectorStore {
  if (vectorBackend() === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("VECTOR_STORE=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    return new SupabaseVectorStore(url, key);
  }
  return new InMemoryVectorStore();
}

// Cached on globalThis so dev HMR doesn't drop the seeded in-memory corpus.
const g = globalThis as unknown as { __idbiVectorStore?: VectorStore };
export const vectorStore: VectorStore = g.__idbiVectorStore ?? (g.__idbiVectorStore = makeStore());
