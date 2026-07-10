import { NextResponse } from "next/server";
import { customers } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const segment = url.searchParams.get("segment");

  const parsedLimit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100;

  const parsedOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

  let result = customers;
  if (q) result = result.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
  if (segment && segment !== "All") result = result.filter(c => c.segment === segment);

  const total = result.length;
  const page = result.slice(offset, offset + limit);

  return NextRe