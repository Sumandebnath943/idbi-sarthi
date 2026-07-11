// Next.js instrumentation hook — runs once when the server process starts.
// Warms local embeddings and seeds the corpus so the first RAG request isn't a
// cold stall, and surfaces provider/store misconfiguration early.

export async function register() {
  // Only the Node.js server runtime can load onnxruntime-node.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { warmEmbeddings, embeddingProvider, embeddingDim } = await import("@/lib/embeddings");
    const { ensureSeeded } = await import("@/lib/ingest");
    const { vectorBackend } = await import("@/lib/vectors");

    const backend = vectorBackend();
    const provider = embeddingProvider();
    console.log(`[instrumentation] vector=${backend} embeddings=${provider} (${embeddingDim()}-dim)`);

    if (backend === "supabase" && provider === "local") {
      console.error(
        "[instrumentation] Config mismatch: Supabase table is vector(768) but embeddings are local (384-dim). Set GEMINI_API_KEY or run supabase/schema.sql with vector(384)."
      );
    }

    await warmEmbeddings();
    // In Supabase mode, prefer seeding via `scripts/seed-corpus.mjs` at deploy
    // time; still ensure locally so dev works out of the box.
    if (backend === "memory") {
      await ensureSeeded();
      console.log("[instrumentation] In-memory corpus seeded, embeddings warmed.");
    }
  } catch (e) {
    // Non-fatal: retrieval lazily warms/seeds on first request (or falls back to
    // keyword-only if the model can't load).
    console.error("[instrumentation] RAG warm-up skipped:", (e as Error).message);
  }
}
