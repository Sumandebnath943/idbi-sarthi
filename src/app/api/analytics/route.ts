import { NextResponse } from "next/server";
import { analyticsSummary } from "@/lib/scoring";
import { customers, leads } from "@/lib/data";
import { healthScore, riskPredict } from "@/lib/scoring";
import { requireUser, scopeCustomers, isElevated, type SessionUser } from "@/lib/auth-guard";

// Cache per scope key (rmId or "all") so RMs and managers get correct views.
const cache = new Map<string, { at: number; payload: unknown }>();
const CACHE_TTL_MS = 60_000;

function buildPayload(user: SessionUser) {
  const custList = scopeCustomers(user, customers);
  const leadList = isElevated(user) ? leads : leads.filter((l) => l.assignedRm === user.rmId);
  const rmFilter = isElevated(user) ? null : user.rmId;

  // Compute each customer's scores exactly once and reuse everywhere.
  const scored = custList.map((c) => {
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
  const monthlyTxn = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.toLocaleString("en-IN", { month: "short" });
    const seed = (d.getFullYear() * 100 + (d.getMonth() + 1)) >>> 0;
    const jitter = (seed * 1103515245 + 12345) >>> 0;
    const transactions = 5200 + i * 480 + (jitter % 500);
    const value = Math.round((32 + i * 2.4 + ((jitter >>> 8) % 30) / 10) * 10) / 10;
    return { month, transactions, value };
  });

  return { ...analyticsSummary(custList, leadList, rmFilter), healthDist, riskDist, monthlyTxn, rows };
}

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  const scopeKey = isElevated(gate.value) ? "all" : `rm:${gate.value.rmId}`;
  const now = Date.now();
  const hit = cache.get(scopeKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.payload);
  }
  const payload = buildPayload(gate.value);
  cache.set(scopeKey, { at: now, payload });
  return NextResponse.json(payload);
}
