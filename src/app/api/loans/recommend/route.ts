import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/data";
import { recommendLoans } from "@/lib/scoring";

export async function POST(req: Request) {
  const body = (await req.json()) as { customerId: string; amount: number; tenureMonths: number };
  const c = getCustomer(body.customerId);
  if (!c) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const recs = recommendLoans(c, body.amount, body.tenureMonths);
  return NextResponse.json({ customerId: c.id, customerName: c.name, recommendations: recs });
}
