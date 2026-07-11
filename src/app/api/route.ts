import { NextResponse } from "next/server";

// API root — minimal liveness probe. Endpoint enumeration was removed to avoid
// handing an attacker a route map (recon hardening).
export async function GET() {
  return NextResponse.json({ service: "IDBI SARTHI API", status: "ok" });
}
