"use client";

import { useRef, useState } from "react";
import { BookOpen, Search, FileText, Sparkles, Quote, AlertCircle, Zap, KeyRound, Upload } from "lucide-react";
import { ModuleHeader, GlassCard, EmptyState } from "@/components/shell/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Source = {
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
type Citation = { docId: string; docTitle: string; category?: string };
type RagAnswer = {
  query: string;
  answer: string | null;
  grounded: boolean;
  refused: boolean;
  citations: Citation[];
  sources: Source[];
  retrieval: "hybrid" | "keyword-only";
};

const SUGGESTED = [
  "What CIBIL score is needed for a home loan?",
  "How is an NPA account recovered?",
  "KYC requirements for onboarding",
  "Credit card limit enhancement rules",
  "Senior citizen fixed deposit benefits",
  "Wealth management SIP limits",
];

export function RagKnowledgeBase() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<RagAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  async function ingest(file: File | null) {
    if (!file) return;
    setIngesting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/rag/ingest", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "ingest failed");
      toast.success(d.message ?? "Policy indexed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setIngesting(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  function search(q?: string) {
    const final = (q ?? query).trim();
    if (!final) { toast.error("Enter a search query"); return; }
    if (q) setQuery(q);
    setLoading(true);
    setData(null);
    fetch("/api/rag/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: final }),
    })
      .then(async (r) => { if (!r.ok) throw new Error("bad response"); return r.json(); })
      .then((d: RagAnswer) => { setData(d); setLoading(false); })
      .catch(() => { setLoading(false); toast.error("Search failed"); });
  }

  return (
    <div>
      <ModuleHeader
        title="RAG Knowledge Base"
        desc="Hybrid semantic + keyword retrieval with grounded, cited answers over the policy corpus"
        icon={BookOpen}
      />

      <GlassCard className="p-4 mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Ask a policy question, e.g. 'What documents are needed for a home loan?'"
              className="glass pl-9"
            />
          </div>
          <Button onClick={() => search()} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Thinking..." : "Ask"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => search(s)}
              className="text-[10px] px-2 py-1 rounded-md bg-muted/40 hover:bg-primary/15 hover:text-primary text-muted-foreground transition-colors">
              {s}
            </button>
          ))}
          <input
            ref={uploadRef}
            type="file"
            accept="application/pdf,.txt,image/*"
            className="hidden"
            onChange={(e) => ingest(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={ingesting}
            className="ml-auto text-[10px] px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Upload className="h-3 w-3" /> {ingesting ? "Indexing..." : "Add policy (PDF/TXT)"}
          </button>
        </div>
      </GlassCard>

      {!data && !loading && <EmptyState icon={BookOpen} message="Ask a question to retrieve and synthesize an answer from the policy corpus" />}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Answer */}
          {data.answer && (
            <GlassCard className="p-5 border-l-2 border-primary/60">
              <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-primary">
                <Quote className="h-3.5 w-3.5" /> Synthesized Answer
                <Badge variant="outline" className="text-[9px] ml-auto flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" />{data.retrieval}
                </Badge>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{data.answer}</div>
              {data.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Sources cited</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.citations.map((c) => (
                      <span key={c.docId} className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/25 font-mono">
                        {c.docId} · {c.docTitle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Refusal */}
          {data.refused && (
            <GlassCard className="p-4 border-l-2 border-amber-500/60">
              <div className="flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>The policy corpus does not contain enough information to answer this. Retrieved passages are shown below for reference — verify against source policies before advising.</span>
              </div>
            </GlassCard>
          )}

          {/* No-key notice */}
          {!data.answer && !data.refused && data.sources.length > 0 && (
            <GlassCard className="p-4 border-l-2 border-muted-foreground/40">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Retrieval ran, but answer synthesis needs an LLM. Set <span className="font-mono">GROQ_API_KEY</span> in <span className="font-mono">.env.local</span> and restart to get grounded answers. Ranked passages are shown below.</span>
              </div>
            </GlassCard>
          )}

          {/* Sources */}
          {data.sources.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Retrieved <span className="text-foreground font-semibold">{data.sources.length}</span> passages · ranked by fused relevance
              </div>
              {data.sources.map((s, i) => (
                <GlassCard key={`${s.docId}-${i}`} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{s.docTitle}</h3>
                          {s.category && <Badge variant="outline" className="text-[9px]">{s.category}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap">
                          <span className="font-mono">{s.docId}</span>
                          {s.section && <span>· {s.section}</span>}
                          {s.vectorRank && <Badge className="text-[8px] bg-cyan-500/10 text-cyan-700 border-cyan-500/30">semantic #{s.vectorRank}</Badge>}
                          {s.keywordRank && <Badge className="text-[8px] bg-amber-500/10 text-amber-700 border-amber-500/30">keyword #{s.keywordRank}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30 shrink-0">RRF {s.score.toFixed(3)}</Badge>
                  </div>
                  <div className={cn("text-[11px] leading-relaxed text-muted-foreground", expanded === `${s.docId}-${i}` ? "" : "line-clamp-3")}>
                    {s.text}
                  </div>
                  {s.text.length > 200 && (
                    <button
                      onClick={() => setExpanded(expanded === `${s.docId}-${i}` ? null : `${s.docId}-${i}`)}
                      className="text-[10px] text-primary hover:underline mt-1"
                    >
                      {expanded === `${s.docId}-${i}` ? "Show less" : "Show full passage"}
                    </button>
                  )}
                </GlassCard>
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} message="No matching passages found. Try different keywords." />
          )}
        </div>
      )}
    </div>
  );
}
