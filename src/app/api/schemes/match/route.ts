import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/data";
import { matchSchemes } from "@/lib/scoring";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("customerId");
  if (!id) return NextResponse.json({ error: "customerId required" }, { status: 400 });
  const c = getCustomer(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const matches = matchSchemes(c);
  return NextResponse.json({ customerId: c.id, customerName: c.name, matches });
}
