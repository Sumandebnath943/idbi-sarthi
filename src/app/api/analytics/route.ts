import { NextResponse } from "next/server";
import { analyticsSummary } from "@/lib/scoring";
import { customers } from "@/lib/data";
import { healthScore, riskPredict } from "@/lib/scoring";

// The underlying dataset is static at runtime, so cache the assembled payload
// briefly to avoid recomputing every score on every request.
let cache: { at: number; payload: unknown } | null = null;
const CACHE_TTL_MS = 60_000;

function buildPayload() {
  // Compute each customer's scores exactly once and reuse everywhere.
  const scored = customers.map((c) => {
    const hs = healthScore(c);
    const risk = riskPredict(c);
    return { c, hs, risk };
  });

  const rows = scored.map(({ c, hs, risk }) => ({
    id: c.id,
    name: c.name,
    segment: c.segment,
    healthScore: hs.score,
    riskProb: Math.round(risk.probability * 100),
    riskBand: risk.band,
    monthlyIncome: c.monthlyIncome,
    savings: c.totalSavings,
    digitalEngagement: c.digitalEngagement,
  }));

  const hDist = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
  const rDist = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  for (const { hs, risk } of scored) {
    hDist[hs.band]++;
    rDist[risk.band]++;
  }
  const healthDist = Object.entries(hDist).map(([band, count]) => ({ band, count }));
  const riskDist = Object.entries(rDist).map(([band, count]) => ({ band, count }));

  // Monthly transaction volume — deterministic (no Math.random) and anchored to
  // the current month so the chart is stable across refreshes and never stale.
  const now = new Date();
  const month