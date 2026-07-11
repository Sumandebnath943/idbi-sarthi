import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth-guard";
import { audit, clientIpFromHeaders } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Authenticates + authorizes: returns 404 for ids outside the caller's book.
  const gate = await requireCustomer(id);
  if (!gate.ok) return gate.res;
  await audit({
    type: "DATA_ACCESS",
    actorId: gate.value.user.id,
    actorRole: gate.value.user.role,
    target: id,
    decision: "allow",
    detail: "customer 360",
    ip: clientIpFromHeaders(req.headers),
  });
  return NextResponse.json(gate.value.customer);
}
