"use client";

import { useEffect, useState } from "react";
import { Landmark, CheckCircle2, XCircle, IndianRupee, Building2, Sparkles } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Match = {
  scheme: {
    id: string; name: string; ministry: string; category: string;
    eligibility: string[]; benefits: string; maxSubsidy: number;
  };
  matchScore: number;
  matchedCriteria: string[];
  missingCriteria: string[];
};

export function SchemeMatcher() {
  const [customerId, setCustomerId] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/schemes/match?customerId=${customerId}`);
        const d = await r.json();
        if (!cancelled) { setMatches(d.matches ?? []); }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  return (
    <div>
      <ModuleHeader
        title="Government Scheme Matcher"
        desc="Eligibility matching across 8 central government welfare schemes"
        icon={Landmark}
      />
      <div className="max-w-md mb-6">
        <CustomerPicker value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId && <EmptyState icon={Landmark} message="Select a customer to match against government schemes" />}

      {customerId && loading && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}

      {matches && matches.length === 0 && <EmptyState icon={XCircle} message="No matching schemes found" />}

      {matches && matches.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{matches.length}</span> schemes ranked by match score
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {matches.map((m, i) => {
              const isHighMatch = m.matchScore >= 70;
              return (
                <GlassCard key={m.scheme.id} className={cn("p-5", i === 0 && isHighMatch && "glow-accent border-primary/40")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center",
                        isHighMatch ? "bg-emerald-500/20" : "bg-primary/15")}>
                        <Building2 className={cn("h-5 w-5", isHighMatch ? "text-emerald-600" : "text-primary")} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-tight">{m.scheme.name}</h3>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{m.scheme.ministry}</div>
                        <Badge variant="outline" className="text-[9px] mt-1">{m.scheme.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("text-2xl font-bold", isHighMatch ? "text-emerald-600" : "text-primary")}>{m.matchScore}%</div>
                      <div className="text-[9px] text-muted-foreground">match</div>
                    </div>
                  </div>

                  <Progress value={m.matchScore} className="h-1 mb-3" />

                  <div className="p-2.5 rounded-lg bg-muted/30 mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Benefits
                    </div>
                    <div className="text-[11px] leading-relaxed">{m.scheme.benefits}</div>
                    <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <IndianRupee className="h-2.5 w-2.5" /> Max subsidy: INR {m.scheme.maxSubsidy.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {m.matchedCriteria.map((c, j) => (
                      <div key={`m-${j}`} className="flex items-start gap-2 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                    {m.missingCriteria.map((c, j) => (
                      <div key={`x-${j}`} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <XCircle className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono">{m.scheme.id}</span>
                    <span>{m.matchedCriteria.length}/{m.matchedCriteria.length + m.missingCriteria.length} criteria met</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
