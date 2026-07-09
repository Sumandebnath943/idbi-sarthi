import { NextResponse } from "next/server";
import { ragSearch } from "@/lib/scoring";

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query: string };
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  const results = ragSearch(query);
  return NextResponse.json({ query, count: results.length, results });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = ragSearch(q);
  return NextResponse.json({ query: q, count: results.length, results });
}
