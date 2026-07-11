import { NextResponse } from "next/server";
import { nextBestActions } from "@/lib/scoring";
import { customers } from "@/lib/data";
import { requireUser, scopeCustomers } from "@/lib/auth-guard";

async function respond() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const scoped = scopeCustomers(gate.value, customers);
  const actions = nextBestActions(scoped);
  return NextResponse.json({ count: actions.length, actions });
}

export async function GET() {
  return respond();
}

export async function POST() {
  return respond();
}
