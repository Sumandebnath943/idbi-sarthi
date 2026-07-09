import { NextResponse } from "next/server";
import { analyticsSummary } from "@/lib/scoring";
import { customers } from "@/lib/data";
import { healthScore, riskPredict } from "@/lib/scoring";

export async function GET() {
  const summary = analyticsSummary();
  // Per-customer table for analytics drill-down
  const rows = customers.map(c => ({
    id: c.id,
    name: c.name,
    segment: c.segment,
    healthScore: healthScore(c).score,
    riskProb: Math.round(riskPredict(c).probability * 100),
    riskBand: riskPredict(c).band,
    monthlyIncome: c.monthlyIncome,
    savings: c.totalSavings,
    digitalEngagement: c.digitalEngagement,
  }));
  // Health distribution
  const dist = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
  for (const c of customers) dist[healthScore(c).band]++;
  const healthDist = Object.entries(dist).map(([band, count]) => ({ band, count }));
  // Risk distribution
  const rdist = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  for (const c of customers) rdist[riskPredict(c).band]++;
  const riskDist = Object.entries(rdist).map(([band, count]) => ({ band, count }));

  // Monthly transaction volume (synthetic)
  const monthlyTxn = Array.from({ length: 6 }).map((_, i) => {
    const month = new Date(2025, 5 - i, 1).toLocaleString("en-IN", { month: "short" });
    return { month, transactions: 8000 - i * 600 + Math.round(Math.random() * 400), value: 45 - i * 3 + Math.random() * 2 };
  }).reverse();

  return NextResponse.json({ ...summary, healthDist, riskDist, monthlyTxn, rows });
}
