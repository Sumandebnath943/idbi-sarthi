// One-time corpus seeding for the configured vector store.
//
// Local/in-memory needs no seeding (it happens at server startup). Run this after
// deploying with Supabase so the first user request isn't slowed by embedding the
// policy corpus. Idempotent — chunk ids are deterministic, upserts de-dupe.
//
// Usage (from project root, with env loaded):
//   bun run scripts/seed-corpus.mjs
//   # or: node --env-file=.env.local scripts/seed-corpus.mjs  (Node >= 20)

import { pathToFileURL } from "node:url";
import path from "node:path";

async function main() {
  const base = pathToFileURL(path.join(process.cwd(), "src", "lib") + path.sep).href;
  const { vectorStore, vectorBackend } = await import(base + "vectors.ts");
  const { embeddingProvider, embeddingDim } = await import(base + "embeddings.ts");
  const { ensureSeeded } = await import(base + "ingest.ts");

  console.log(`Vector backend : ${vectorBackend()}`);
  console.log(`Embeddings     : ${embeddingProvider()} (${embeddingDim()}-dim)`);

  if (vectorBackend() === "supabase" && embeddingProvider() === "local") {
    console.error("ERROR: Supabase table is vector(768) but embeddings are local (384-dim). Set GEMINI_API_KEY.");
    process.exit(1);
  }

  const t0 = Date.now();
  await ensureSeeded();
  console.log(`Seeded corpus. Total chunks: ${await vectorStore.size()} (${Date.now() - t0}ms)`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
