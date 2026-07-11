import { NextResponse } from "next/server";
import { leads } from "@/lib/data";
import { requireUser, isElevated } from "@/lib/auth-guard";

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  // RMs see only leads assigned to them; managers/compliance/admin see all.
  const scoped = isElevated(gate.value)
    ? leads
    : leads.filter(l => l.assignedRm === gate.value.rmId);

  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
  const grouped = stages.map(stage => ({ stage, items: scoped.filter(l => l.stage === stage) }));
  return NextResponse.json({ total: scoped.length, grouped, leads: scoped });
}
