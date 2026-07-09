"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Activity } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, BandBadge, StatCard, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
} from "recharts";

type Result = {
  score: number;
  band: string;
  factors: { key: string; label: string; weight: number; raw: number; weighted: number; description: string }[];
};

const BAND_COLOR: Record<string, string> = {
  Excellent: "#34d399", Good: "#22d3ee", Fair: "#fbbf24", Poor: "#f87171",
};

export function HealthScore() {
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/health-score?customerId=${customerId}`);
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
        title="Financial Health Score"
        desc="Weighted 0-900 score across 6 factors — fully explainable"
        icon={HeartPulse}
      />
      <div className="max-w-md mb-6">
        <CustomerPicker value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId && <EmptyState icon={HeartPulse} message="Select a customer to compute their financial health score" />}

      {customerId && loading && <Skeleton className="h-96 rounded-xl" />}

      {customerId && !loading && data && (
        <div className="space-y-6">
          {/* Hero score */}
          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="relative h-44 w-44 flex items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={BAND_COLOR[data.band]} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(data.score / 900) * 264} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ filter: `drop-shadow(0 0 6px ${BAND_COLOR[data.band]})` }}
                  />
                </svg>
                <div>
                  <div className="text-4xl font-bold tracking-tight" style={{ color: BAND_COLOR[data.band] }}>{data.score}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 900</div>
                </div>
              </div>
              <div className="mt-4">
                <BandBadge band={data.band} />
              </div>
              <p className="text-xs text-muted-foreground mt-3 max-w-[220px]">
                {data.band === "Excellent" && "Outstanding financial discipline — premium segment eligible."}
                {data.band === "Good" && "Strong profile — minor optimizations can elevate further."}
                {data.band === "Fair" && "Needs attention — review debt and savings ratios."}
                {data.band === "Poor" && "At-risk profile — recommend financial restructuring."}
              </p>
            </GlassCard>

            {/* Radar */}
            <GlassCard className="lg:col-span-2 p-5">
              <SectionTitle>Factor Breakdown (Radar)</SectionTitle>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data.factors.map(f => ({ factor: f.label, score: Math.round(f.raw * 100) }))}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                  <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Factors */}
          <div className="grid md:grid-cols-2 gap-3">
            {data.factors.map(f => (
              <GlassCard key={f.key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{f.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Weight {(f.weight*100).toFixed(0)}%</span>
                </div>
                <Progress value={f.raw * 100} className="h-1.5 mb-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{f.description}</span>
                  <span className="font-mono font-semibold">{f.weighted}</span>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Top Strength" value={data.factors.reduce((a, b) => a.raw > b.raw ? a : b).label} tone="success" />
            <StatCard label="Weakest Factor" value={data.factors.reduce((a, b) => a.raw < b.raw ? a : b).label} tone="warning" />
            <StatCard label="Sum of Weights" value={`${(data.factors.reduce((s, f) => s + f.weight, 0)*100).toFixed(0)}%`} />
            <StatCard label="Confidence" value="High" tone="primary" />
          </div>
        </div>
      )}
    </div>
  );
}
