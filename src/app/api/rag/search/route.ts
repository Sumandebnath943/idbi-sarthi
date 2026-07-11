import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/api-utils";
import { answerQuery } from "@/lib/rag";

// Embeddings run on the Node runtime (onnxruntime-node native addon).
export const runtime = "nodejs";

const SearchSchema = z.object({
  query: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, SearchSchema);
  if (parsed.response) return parsed.response;
  const result = await answerQuery(parsed.data.query);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 500);
  if (!q.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });
  const result = await answerQuery(q);
  return NextResponse.json(result);
}
