import { NextResponse } from "next/server";
import { z } from "zod";
import { ragSearch } from "@/lib/scoring";
import { parseBody } from "@/lib/api-utils";

const SearchSchema = z.object({
  query: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, SearchSchema);
  if (parsed.response) return parsed.response;
  const { query } = parsed.data;
  const results = ragSearch(query);
  return NextResponse.json({ query, count: results.length, results });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 500);
  if (!q.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });
  const results = ragSearch(q);
  return NextResponse.json({ query: q, count: results.length, results });
}
