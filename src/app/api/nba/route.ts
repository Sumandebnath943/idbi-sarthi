import { NextResponse } from "next/server";
import { nextBestActions } from "@/lib/scoring";

export async function GET() {
  return NextResponse.json({ count: 0, actions: [] });
}

export async function POST() {
  const actions = nextBestActions();
  return NextResponse.json({ count: actions.length, actions });
}
