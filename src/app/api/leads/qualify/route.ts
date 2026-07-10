import { NextResponse } from "next/server";
import { z } from "zod";
import { qualifyLead } from "@/lib/scoring";
import { parseBody } from "@/lib/api-utils";

const LeadScoreSchema = z.object({
  income: z.number().finite().nonnegative(),
  cibil: z.number().finite().min(300).max(900),
 