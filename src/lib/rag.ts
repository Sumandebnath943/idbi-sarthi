// RAG answer synthesis: hybrid retrieval → grounded, cited generation.
//
// Retrieval is always available (keyword works even with no model). Generation
// needs Groq; without a key we return the ranked passages and let the UI say so,
// matching the app's honest-fallback convention.

import { llmComplete, llmConfigured } from "./llm";
import { hybridSearch } from "./retrieval";

export type RagSource = {
  docId: string;
  docTitle: string;
  category?: string;
  section?: string;
  text: string;
  score: number;
  semantic: boolean;
  vectorRank?: number;
  keywordRank?: number;
};

export type RagCitation = { docId: string; docTitle: string; category?: string };

export type RagAnswer = {
  query: string;
  answer: string | null;
  grounded: boolean;   // true when an LLM synthesized the answer
  refused: boolean;    // model had passages but couldn't answer from them
  citations: RagCitation[];
  sources: RagSource[];
  retrieval: "hybrid" | "keyword-only";
};

const SYSTEM_PROMPT = `You are the IDBI SARTHI policy assistant for bank Relationship Managers.
Answer the RM's question using ONLY the numbered policy passages provided. Rules:
- Cite every claim inline with its policy id in square brackets, e.g. [POL-001].
- Be concise (3-6 sentences), professional, and specific (quote figures/criteria from the passages).
- Use INR formatting.
- If the passages do not contain the answer, reply with exactly: NO_ANSWER
Do not use outside knowledge or invent policy numbers.`;

function buildContext(sources: RagSource[]): string {
  return sources
    .map((s) => `[${s.docId}] ${s.docTitle}${s.category ? ` (${s.category})` : ""}\n${s.text}`)
    .join("\n\n");
}

/** Retrieve, then (if Groq is available) synthesize a grounded, cited answer. */
export async function answerQuery(query: string, k = 6): Promise<RagAnswer> {
  const hits = await hybridSearch(query, k);
  const retrieval: RagAnswer["retrieval"] = hits.some((h) => h.semantic) ? "hybrid" : "keyword-only";

  const sources: RagSource[] = hits.map((h) => ({
    docId: h.chunk.docId,
    docTitle: h.chunk.docTitle,
    category: h.chunk.category,
    section: h.chunk.section,
    text: h.chunk.text,
    score: Math.round(h.score * 10000) / 10000,
    semantic: h.semantic,
    vectorRank: h.vectorRank,
    keywordRank: h.keywordRank,
  }));

  // Distinct documents, best-ranked first, for the citation list.
  const distinct: RagCitation[] = [];
  const seen = new Set<string>();
  for (const s of sources) {
    if (!seen.has(s.docId)) {
      seen.add(s.docId);
      distinct.push({ docId: s.docId, docTitle: s.docTitle, category: s.category });
    }
  }

  if (sources.length === 0) {
    return { query, answer: null, grounded: false, refused: false, citations: [], sources, retrieval };
  }

  if (!llmConfigured()) {
    return { query, answer: null, grounded: false, refused: false, citations: distinct, sources, retrieval };
  }

  try {
    const { text: reply } = await llmComplete(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Question: ${query}\n\nPolicy passages:\n${buildContext(sources)}` },
      ],
      { temperature: 0.2, maxTokens: 700 }
    );

    const refused = /^\s*NO_ANSWER\s*$/i.test(reply.trim()) || /\bNO_ANSWER\b/.test(reply);
    if (refused) {
      return { query, answer: null, grounded: true, refused: true, citations: [], sources, retrieval };
    }

    // Cite only the documents the model actually referenced; fall back to the
    // top distinct docs if it cited none explicitly.
    const cited = new Set((reply.match(/POL-\d{3}/g) ?? []).map((s) => s.toUpperCase()));
    const citations = cited.size > 0 ? distinct.filter((d) => cited.has(d.docId)) : distinct.slice(0, 3);

    return { query, answer: reply.trim(), grounded: true, refused: false, citations, sources, retrieval };
  } catch (e) {
    console.error("RAG generation failed:", (e as Error).message);
    // Retrieval still succeeded — return passages without a synthesized answer.
    return { query, answer: null, grounded: false, refused: false, citations: distinct, sources, retrieval };
  }
}
