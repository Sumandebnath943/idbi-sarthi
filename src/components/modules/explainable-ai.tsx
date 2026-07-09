"use client";

import { useEffect, useState } from "react";
import { Brain, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, BandBadge, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

type Feature = {
  name: string; value: string; contribution: number; direction: "positive" | "negative" | "neutral";
};
type Result = {
  outcome: string;
  baseValue: number;
  features: Feature[];
};

export function ExplainableAI() {
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/explain?customerId=${customerId}`);
        const d = await r.json();
        if (!cancelled) { setData(d); }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  // Compute final probability from base + contributions
  const final = data ? Math.max(0.02, Math.min(0.98, data.baseValue + data.features.reduce((s, f) => s + f.contribution, 0))) : 0;

  return (
    <div>
      <ModuleHeader
        title="Explainable AI"
        desc="SHAP-style feature attribution for loan approval decisions"
        icon={Brain}
      />
      <div className="max-w-md mb-6">
        <CustomerPicker value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId && <EmptyState icon={Brain} message="Select a customer to see decision explanation" />}

      {customerId && loading && <Skeleton className="h-96 rounded-xl" />}

      {customerId && !loading && data && (
        <div className="space-y-6">
          {/* Outcome */}
          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="p-6 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Decision</div>
              <div className="text-4xl font-bold mb-3" style={{
                color: data.outcome === "Approve" ? "#34d399" : data.outcome === "Review" ? "#fbbf24" : "#f87171"
              }}>
                {data.outcome}
              </div>
              <BandBadge band={data.outcome} />
              <div className="mt-4 text-xs text-muted-foreground">
                Model confidence: <span className="font-semibold text-foreground">{(final * 100).toFixed(1)}%</span>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2 p-5">
              <SectionTitle action={<Sparkles className="h-3.5 w-3.5 text-primary" />}>Force Plot (Base → Final)</SectionTitle>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Base value (avg approval rate)</span>
                    <span className="font-mono">{(data.baseValue * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${data.baseValue * 100}%` }} />
                  </div>
                </div>

                {/* Contributions stacked */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Feature contributions (stacked)</div>
                  <div className="h-8 w-full rounded-md overflow-hidden flex bg-muted/30 border border-border/40">
                    {data.features.map((f, i) => {
                      const w = Math.abs(f.contribution) * 100;
                      const color = f.direction === "positive" ? "#34d399" : f.direction === "negative" ? "#f87171" : "#64748b";
                      return (
                        <div
                          key={i}
                          style={{ width: `${w}%`, background: color, minWidth: 4 }}
                          title={`${f.name}: ${f.contribution > 0 ? "+" : ""}${(f.contribution * 100).toFixed(1)}%`}
                          className="h-full transition-all hover:opacity-80"
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Final predicted probability</span>
                    <span className="font-mono">{(final * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${final * 100}%`,
                        background: data.outcome === "Approve" ? "#34d399" : data.outcome === "Review" ? "#fbbf24" : "#f87171"
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] pt-2">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-400" />Push toward Approve</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-400" />Push toward Decline</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Feature detail chart */}
          <GlassCard className="p-5">
            <SectionTitle>Feature Attribution Waterfall</SectionTitle>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.features.map(f => ({ ...f, absVal: Math.abs(f.contribution * 100) }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" width={130} />
                <Tooltip
                  contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number, _n: string, p: { payload: Feature }) => [
                    `${p.payload.contribution > 0 ? "+" : ""}${(p.payload.contribution * 100).toFixed(1)}% (${p.payload.value})`,
                    p.payload.name
                  ]}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="absVal" radius={[0, 4, 4, 0]}>
                  {data.features.map((f, i) => (
                    <Cell key={i} fill={f.direction === "positive" ? "#34d399" : f.direction === "negative" ? "#f87171" : "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 gap-3">
            {data.features.map((f, i) => {
              const Icon = f.direction === "positive" ? ArrowUp : f.direction === "negative" ? ArrowDown : Minus;
              const color = f.direction === "positive" ? "text-emerald-400" : f.direction === "negative" ? "text-red-400" : "text-muted-foreground";
              return (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{f.name}</span>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Value: <span className="text-foreground font-mono">{f.value}</span></span>
                    <span className={`font-mono font-semibold ${color}`}>
                      {f.contribution > 0 ? "+" : ""}{(f.contribution * 100).toFixed(1)}%
                    </span>
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
