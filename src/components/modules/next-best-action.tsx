"use client";

import { useEffect, useState } from "react";
import { Target, Phone, Mail, MapPin, Smartphone, MessageCircle, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, PriorityBadge, EmptyState } from "@/components/shell/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NBA = {
  id: string; customerId: string; customerName: string;
  action: string; rationale: string;
  channel: "Call" | "Email" | "Branch Visit" | "In-App" | "WhatsApp";
  priority: "P0" | "P1" | "P2" | "P3";
  expectedUplift: string; deadline: string;
};

const CHANNEL_ICON: Record<string, typeof Phone> = {
  "Call": Phone, "Email": Mail, "Branch Visit": MapPin, "In-App": Smartphone, "WhatsApp": MessageCircle,
};

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 } as const;

export function NextBestAction() {
  const [actions, setActions] = useState<NBA[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "P0" | "P1" | "P2" | "P3">("all");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/nba", { method: "POST" });
      const d = await r.json();
      setActions(d.actions ?? []);
      toast.success(`Generated ${d.count} actions`);
    } catch {
      toast.error("Failed to generate actions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const r = await fetch("/api/nba", { method: "POST" });
        const d = await r.json();
        if (!cancelled) { setActions(d.actions ?? []); toast.success(`Generated ${d.count} actions`); }
      } catch {
        if (!cancelled) toast.error("Failed to generate actions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = actions?.filter(a => filter === "all" || a.priority === filter) ?? [];
  const sorted = [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const counts = actions?.reduce((acc, a) => { acc[a.priority] = (acc[a.priority] || 0) + 1; return acc; }, {} as Record<string, number>) ?? {};

  return (
    <div>
      <ModuleHeader
        title="Next Best Action"
        desc="Proactive, prioritized recommendations across the customer book"
        icon={Target}
      />

      {/* Filter chips + regenerate */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "P0", "P1", "P2", "P3"] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                filter === p ? "bg-primary/15 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "all" ? `All (${actions?.length ?? 0})` : `${p} (${counts[p] ?? 0})`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Target className="h-3 w-3 mr-1.5" />} Regenerate
        </Button>
      </div>

      {loading && (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <EmptyState icon={Target} message="No actions match the current filter" />
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {sorted.map(a => {
            const Icon = CHANNEL_ICON[a.channel] ?? Phone;
            const isUrgent = a.priority === "P0";
            return (
              <GlassCard key={a.id} className={cn("p-4 transition-all hover:translate-y-[-1px]", isUrgent && "border-red-500/40 bg-red-500/5")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center",
                      isUrgent ? "bg-red-500/20" : "bg-primary/15")}>
                      <Icon className={cn("h-4 w-4", isUrgent ? "text-red-600" : "text-primary")} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{a.customerName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{a.customerId}</div>
                    </div>
                  </div>
                  <PriorityBadge p={a.priority} />
                </div>

                <div className="text-xs font-medium mb-2 leading-snug">{a.action}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">{a.rationale}</div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {a.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {a.deadline}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                    <TrendingUp className="h-2.5 w-2.5 mr-1" />{a.expectedUplift}
                  </Badge>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
