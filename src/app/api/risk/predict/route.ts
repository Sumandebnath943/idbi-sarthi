import { NextResponse } from "next/server";
import { riskPredict } from "@/lib/scoring";
import { requireCustomer } from "@/lib/auth-guard";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("customerId");
  if (!id) return NextResponse.json({ error: "customerId required" }, { status: 400 });
  const gate = await requireCustomer(id);
  if (!gate.ok) return gate.res;
  const c = gate.value.customer;
  return NextResponse.json({ customerId: c.id, customerName: c.name, ...riskPredict(c) });
}
