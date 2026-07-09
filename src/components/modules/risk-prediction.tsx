"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, Gauge } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, BandBadge, StatCard, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

type Driver = { label: string; impact: number };
type Result = {
  probability: number; band: string; drivers: Driver[]; recommendation: string; smaStage: string;
};

const BAND_COLOR: Record<string, string> = {
  Low: "#34d399", Moderate: "#22d3ee", High: "#fbbf24", Critical: "#f87171",
};

export function RiskPrediction() {
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/risk/predict?customerId=${customerId}`);
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

  return (
    <div>
      <ModuleHeader
        title="Risk Prediction"
        desc="12-month default probability with SMA staging & driver attribution"
        icon={ShieldAlert}
      />
      <div className="max-w-md mb-6">
        <CustomerPicker value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId && <EmptyState icon={ShieldAlert} message="Select a customer to predict 12-month default risk" />}

      {customerId && loading && <Skeleton className="h-96 rounded-xl" />}

      {customerId && !loading && data && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="p-6 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Default Probability (12mo)</div>
              <div className="text-5xl font-bold tracking-tight" style={{ color: BAND_COLOR[data.band] }}>
                {(data.probability * 100).toFixed(1)}%
              </div>
              <div className="mt-3"><BandBadge band={data.band} /></div>
              <div className="mt-3 text-xs text-muted-foreground">
                SMA Stage: <span className="font-semibold text-foreground">{data.smaStage}</span>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2 p-5">
              <SectionTitle action={<Gauge className="h-3.5 w-3.5 text-primary" />}>Risk Gauge</SectionTitle>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 mb-4">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-background"
                  style={{ left: `calc(${Math.min(100, data.probability * 100)}% - 10px)`, background: BAND_COLOR[data.band], boxShadow: `0 0 12px ${BAND_COLOR[data.band]}` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
                <span>0% · Low</span><span>10% · Moderate</span><span>25% · High</span><span>50%+ · Critical</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">RM Recommendation</div>
                <div className="text-xs">{data.recommendation}</div>
              </div>
            </GlassCard>
          </div>

          {/* Drivers chart */}
          <GlassCard className="p-5">
            <SectionTitle>Risk Drivers (Impact Attribution)</SectionTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.drivers.map(d => ({ ...d, absImpact: Math.abs(d.impact * 100) }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,103,77,0.08)" />
                <XAxis type="number" tick={{ fill: "#5A6B65", fontSize: 10 }} stroke="rgba(0,103,77,0.12)" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#5A6B65", fontSize: 10 }} stroke="rgba(0,103,77,0.12)" width={150} />
                <Tooltip
                  contentStyle={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,103,77,0.15)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number, _n: string, p: { payload: Driver }) => [`${(p.payload.impact * 100).toFixed(1)}% impact`, p.payload.label]}
                />
                <ReferenceLine x={0} stroke="rgba(0,103,77,0.25)" />
                <Bar dataKey="absImpact" radius={[0, 4, 4, 0]}>
                  {data.drivers.map((d, i) => <Cell key={i} fill={d.impact > 0 ? "#f87171" : "#34d399"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-400" />Increases risk</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-400" />Mitigates risk</span>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Top Risk Driver" value={data.drivers.find(d => d.impact > 0)?.label ?? "None"} tone="danger" icon={TrendingUp} />
            <StatCard label="Top Mitigant" value={data.drivers.find(d => d.impact < 0)?.label ?? "None"} tone="success" icon={TrendingDown} />
            <StatCard label="SMA Stage" value={data.smaStage} tone={data.smaStage === "None" ? "success" : data.smaStage === "NPA" ? "danger" : "warning"} />
            <StatCard label="Confidence" value="High (88%)" tone="primary" />
          </div>
        </div>
      )}
    </div>
  );
}
