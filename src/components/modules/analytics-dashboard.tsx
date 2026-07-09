"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Wallet, HeartPulse, ShieldAlert, TrendingUp, Building2, Award } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, StatCard } from "@/components/shell/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BandBadge } from "@/components/shell/primitives";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from "recharts";

type Analytics = {
  totalAUM: number;
  totalCustomers: number;
  avgHealth: number;
  highRiskCount: number;
  riskRate: number;
  segmentDist: { name: string; value: number }[];
  stageDist: { name: string; value: number }[];
  topRMs: { id: string; name: string; role: string; branch: string; bookSize: number; customersManaged: number; nps: number }[];
  healthDist: { band: string; count: number }[];
  riskDist: { band: string; count: number }[];
  monthlyTxn: { month: string; transactions: number; value: number }[];
  rows: {
    id: string; name: string; segment: string;
    healthScore: number; riskProb: number; riskBand: string;
    monthlyIncome: number; savings: number; digitalEngagement: number;
  }[];
};

const PIE_COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa"];

export function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/analytics");
        const d = await r.json();
        if (!cancelled) { setData(d); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <ModuleHeader title="Analytics Dashboard" desc="Portfolio-wide KPIs, distributions & trends" icon={BarChart3} />
        <div className="grid lg:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <ModuleHeader
        title="Analytics Dashboard"
        desc="Portfolio-wide KPIs, customer distributions & RM performance"
        icon={BarChart3}
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total AUM" value={`INR ${(data.totalAUM/10000000).toFixed(2)} Cr`} tone="primary" icon={Wallet}
          change={{ value: "+12.4% MoM", positive: true }} />
        <StatCard label="Total Customers" value={data.totalCustomers} icon={Users}
          change={{ value: "+3 this week", positive: true }} />
        <StatCard label="Avg Health Score" value={data.avgHealth} tone="success" icon={HeartPulse}
          change={{ value: "+8 pts QoQ", positive: true }} />
        <StatCard label="High-Risk Customers" value={`${data.highRiskCount} (${(data.riskRate*100).toFixed(0)}%)`} tone="danger" icon={ShieldAlert}
          change={{ value: "-2 WoW", positive: true }} />
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Segment distribution */}
        <GlassCard className="p-5">
          <SectionTitle>Customer Segments</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.segmentDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {data.segmentDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Lead funnel */}
        <GlassCard className="p-5">
          <SectionTitle>Lead Pipeline Stages</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.stageDist} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.stageDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Health & risk distribution */}
        <GlassCard className="p-5">
          <SectionTitle>Health Score Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.healthDist} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="band" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.healthDist.map((d, i) => {
                  const color = d.band === "Excellent" ? "#34d399" : d.band === "Good" ? "#22d3ee" : d.band === "Fair" ? "#fbbf24" : "#f87171";
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle>Risk Band Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.riskDist} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="band" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.riskDist.map((d, i) => {
                  const color = d.band === "Low" ? "#34d399" : d.band === "Moderate" ? "#22d3ee" : d.band === "High" ? "#fbbf24" : "#f87171";
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Monthly trends */}
      <GlassCard className="p-5 mb-6">
        <SectionTitle action={<TrendingUp className="h-3.5 w-3.5 text-primary" />}>Monthly Transaction Volume & Value (6 months)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.monthlyTxn} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} name="Transactions" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Value (Cr INR)" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* RM leaderboard */}
      <GlassCard className="p-5 mb-6">
        <SectionTitle action={<Award className="h-3.5 w-3.5 text-primary" />}>RM Performance Leaderboard</SectionTitle>
        <div className="space-y-2">
          {data.topRMs.map((rm, i) => (
            <div key={rm.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-500/30 text-amber-300" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{rm.name}</div>
                <div className="text-[10px] text-muted-foreground">{rm.role} · {rm.branch} · {rm.id}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">INR {(rm.bookSize/10000000).toFixed(1)} Cr</div>
                <div className="text-[10px] text-muted-foreground">Book Size · {rm.customersManaged} customers · NPS {rm.nps}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Customer table */}
      <GlassCard className="p-5">
        <SectionTitle>Customer Portfolio Drill-Down</SectionTitle>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40">
                <TableHead className="text-[10px] uppercase">Customer</TableHead>
                <TableHead className="text-[10px] uppercase">Segment</TableHead>
                <TableHead className="text-[10px] uppercase">Health</TableHead>
                <TableHead className="text-[10px] uppercase">Risk</TableHead>
                <TableHead className="text-[10px] uppercase text-right">Income</TableHead>
                <TableHead className="text-[10px] uppercase text-right">Savings</TableHead>
                <TableHead className="text-[10px] uppercase text-right">Digital</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(r => (
                <TableRow key={r.id} className="border-border/20">
                  <TableCell className="py-2">
                    <div className="text-xs font-medium">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{r.id}</div>
                  </TableCell>
                  <TableCell className="py-2"><Badge variant="outline" className="text-[9px]">{r.segment}</Badge></TableCell>
                  <TableCell className="py-2">
                    <span className={`text-xs font-mono font-semibold ${r.healthScore >= 720 ? "text-emerald-400" : r.healthScore >= 600 ? "text-cyan-400" : r.healthScore >= 480 ? "text-amber-400" : "text-red-400"}`}>{r.healthScore}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono ${r.riskProb < 10 ? "text-emerald-400" : r.riskProb < 25 ? "text-cyan-400" : r.riskProb < 50 ? "text-amber-400" : "text-red-400"}`}>{r.riskProb}%</span>
                      <BandBadge band={r.riskBand} />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right text-xs font-mono">INR {(r.monthlyIncome/1000).toFixed(0)}K</TableCell>
                  <TableCell className="py-2 text-right text-xs font-mono">INR {(r.savings/100000).toFixed(1)}L</TableCell>
                  <TableCell className="py-2 text-right text-xs font-mono">{(r.digitalEngagement*100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}
