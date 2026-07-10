"use client";

import { useState } from "react";
import { BookOpen, Search, FileText, Tag, Clock, ChevronRight, Sparkles } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, EmptyState } from "@/components/shell/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Result = {
  policy: {
    id: string; title: string; category: string; summary: string; content: string;
    tags: string[]; version: string; effectiveDate: string;
  };
  score: number;
  snippet: string;
};

const SUGGESTED = [
  "home loan eligibility",
  "personal loan risk assessment",
  "KYC requirements",
  "NPA recovery procedure",
  "credit card limit enhancement",
  "wealth management advisory",
];

export function RagKnowledgeBase() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function search(q?: string) {
    const final = (q ?? query).trim();
    if (!final) { toast.error("Enter a search query"); return; }
    if (q) setQuery(q);
    setLoading(true);
    setResults(null);
    fetch("/api/rag/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: final }),
    })
      .then(async r => { if (!r.ok) throw new Error("bad response"); return r.json(); })
      .then(d => { setResults(d.results ?? []); setLoading(false); })
      .catch(() => { setResults([]); setLoading(false); toast.error("Search failed"); });
  }

  return (
    <div>
      <ModuleHeader
        title="RAG Knowledge Base"
        desc="Semantic retrieval over banking policies with snippet extraction"
        icon={BookOpen}
      />

      <GlassCard className="p-4 mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Ask about policies, e.g. 'home loan documentation requirements'"
              className="glass pl-9"
            />
          </div>
          <Button onClick={() => search()} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Searching..." : "Retrieve"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => search(s)}
              className="text-[10px] px-2 py-1 rounded-md bg-muted/40 hover:bg-primary/15 hover:text-primary text-muted-foreground transition-colors">
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {!results && !loading && <EmptyState icon={BookOpen} message="Search the policy corpus to retrieve relevant documents" />}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      )}

      {results && results.length === 0 && (
        <EmptyState icon={Search} message="No matching policies found. Try different keywords." />
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Found <span className="text-foreground font-semibold">{results.length}</span> relevant policies · ranked by relevance score
          </div>
          {results.map((r, i) => (
            <GlassCard key={r.policy.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold">{r.policy.title}</h3>
                      <Badge variant="outline" className="text-[9px]">{r.policy.category}</Badge>
                      <Badge className="text-[9px] bg-primary/15 text-primary border-primary/30">Score: {r.score}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className="font-mono">{r.policy.id}</span>
                      <span className="flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{r.policy.version}</span>
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Effective {r.policy.effectiveDate}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === r.policy.id ? null : r.policy.id)}>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded === r.policy.id ? "rotate-90" : ""}`} />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mb-2">{r.policy.summary}</div>

              <div className="p-3 rounded-lg bg-muted/30 border-l-2 border-primary/60 text-[11px] leading-relaxed">
                <div className="text-[9px] uppercase tracking-wider text-primary mb-1">Retrieved Snippet</div>
                {r.snippet}
              </div>

              {expanded === r.policy.id && (
                <div className="mt-3 p-3 rounded-lg bg-background/40 text-[11px] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                  {r.policy.content}
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-3">
                {r.policy.tags.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">#{t}</span>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
