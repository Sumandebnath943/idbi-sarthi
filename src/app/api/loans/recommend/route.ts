import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/data";
import { recommendLoans } from "@/lib/scoring";
import { parseBody } from "@/lib/api-utils";

const RecommendSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().finite().positive(),
  tenureMonths: z.number().finite().int().positive().max(600),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, RecommendSchema);
  if (parsed.response) return parsed.response;
  const { customerId, amount, tenureMonths } = par