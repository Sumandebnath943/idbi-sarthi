import { NextResponse } from "next/server";
import { qualifyLead, type LeadScoreInput } from "@/lib/scoring";

export async function POST(req: Request) {
  const body = (await req.json()) as LeadScoreInput;
  const result = qualifyLead(body);
  return NextResponse.json(result);
}
