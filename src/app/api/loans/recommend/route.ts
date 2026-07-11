import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendLoans } from "@/lib/scoring";
import { parseBody } from "@/lib/api-utils";
import { requireCustomer } from "@/lib/auth-guard";

const RecommendSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().finite().positive(),
  tenureMonths: z.number().finite().int().positive().max(600),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, RecommendSchema);
  if (parsed.response) return parsed.response;
  const { customerId, amount, tenureMonths } = parsed.data;
  const gate = await requireCustomer(customerId);
  if (!gate.ok) return gate.res;
  const c = gate.value.customer;
  const recs = recommendLoans(c, amount, tenureMonths);
  return NextResponse.json({ customerId: c.id, customerName: c.name, recommendations: recs });
}
