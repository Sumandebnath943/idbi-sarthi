import { NextResponse } from "next/server";
import { leads } from "@/lib/data";

export async function GET() {
  // Group by stage
  const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
  const grouped = stages.map(stage => ({ stage, items: leads.filter(l => l.stage === stage) }));
  return NextResponse.json({ total: leads.length, grouped, leads });
}
