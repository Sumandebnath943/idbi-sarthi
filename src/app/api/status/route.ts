import { NextResponse } from "next/server";
import { activeLlmProvider } from "@/lib/llm";
import { embeddingProvider, embeddingDim } from "@/lib/embeddings";
import { vectorBackend } from "@/lib/vectors";
import { GEMINI_MODEL, GEMINI_EMBED_MODEL } from "@/lib/gemini";
import { GROQ_TEXT_MODEL } from "@/lib/groq";

export const runtime = "nodejs";

// Reports the actually-active stack so the UI can label itself honestly
// (replaces the old hardcoded "LLM: Groq · RAG: FAISS · DB: SQLite").
export async function GET() {
  const llm = activeLlmProvider();
  const emb = embeddingProvider();
  const vec = vectorBackend();

  const llmLabel = llm === "gemini" ? `Gemini (${GEMINI_MODEL})` : llm === "groq" ? `Groq (${GROQ_TEXT_MODEL})` : "Not configured";
  const embLabel = emb === "gemini" ? `Gemini (${GEMINI_EMBED_MODEL})` : "MiniLM (local)";
  const vecLabel = vec === "supabase" ? "Supabase pgvector" : "In-Memory";

  return NextResponse.json({
    llm,
    embeddings: emb,
    vector: vec,
    embeddingDim: embeddingDim(),
    retrieval: "Hybrid (vector + keyword, RRF)",
    labels: {
      llm: llmLabel,
      embeddings: embLabel,
      vector: vecLabel,
      // Compact one-liner for the sidebar/topbar status chip.
      short: `LLM: ${llm === "none" ? "—" : llm[0].toUpperCase() + llm.slice(1)} · Retrieval: Hybrid · Store: ${vec === "supabase" ? "Supabase" : "In-Memory"}`,
    },
  });
}
