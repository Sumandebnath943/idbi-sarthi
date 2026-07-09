import { NextResponse } from "next/server";
import { customers } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const segment = url.searchParams.get("segment");
  const limit = parseInt(url.searchParams.get("limit") ?? "100");

  let result = customers;
  if (q) result = result.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
  if (segment && segment !== "All") result = result.filter(c => c.segment === segment);

  return NextResponse.json({
    total: result.length,
    customers: result.slice(0, limit).map(c => ({
      id: c.id, name: c.name, age: c.age, segment: c.segment, city: c.city,
      monthlyIncome: c.monthlyIncome, rmId: c.rmId, kycStatus: c.kycStatus,
      npaFlag: c.npaFlag, digitalEngagement: c.digitalEngagement,
    })),
  });
}
