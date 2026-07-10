import { NextResponse } from "next/server";
import { z } from "zod";
import { qualifyLead } from "@/lib/scoring";
import { parseBody } from "@/lib/api-utils";

const LeadScoreSchema = z.object({
  income: z.number().finite().nonnegative(),
  cibil: z.number().finite().min(300).max(900),
  age: z.number().finite().int().min(18).max(100),
  existingCustomer: z.boolean(),
  interest: z.enum(["High", "Medium", "Low"]),
  sourceValue: z.number().finite().nonnegative(),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, LeadScoreSchema);
  if (parsed.response) return parsed.response;
  const result = qualifyLead(parsed.data);
  return NextResponse.json(result);
}
