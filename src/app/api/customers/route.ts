import { NextResponse } from "next/server";
import { customers } from "@/lib/data";
import { requireUser, scopeCustomers } from "@/lib/auth-guard";

export async function GET(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const segment = url.searchParams.get("segment");

  const parsedLimit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100;

  const parsedOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

  // Scope to the caller's book (RMs); managers/compliance/admin see all.
  let result = scopeCustomers(gate.value, customers);
  if (q) result = result.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
  if (segment && segment !== "All") result = result.filter(c => c.segment === segment);

  const total = result.length;
  const page = result.slice(offset, offset + limit);

  return NextResponse.json({
    total,
    offset,
    limit,
    count: page.length,
    hasMore: offset + page.length < total,
    customers: page.map(c => ({
      id: c.id, name: c.name, age: c.age, segment: c.segment, city: c.city,
      monthlyIncome: c.monthlyIncome, rmId: c.rmId, kycStatus: c.kycStatus,
      npaFlag: c.npaFlag, digitalEngagement: c.digitalEngagement,
    })),
  });
}
