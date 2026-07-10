import { NextResponse } from "next/server";

// API root — lightweight service status / discovery endpoint.
export async function GET() {
  return NextResponse.json({
    service: "IDBI SARTHI API",
    status: "ok",
    version: "0.2.0",
    endpoints: [
      "/api/customers",
      "/api/customers/[id]",
      "/api/health-score",
      "/api/risk/predict",
      "/api/explain",
      "/api/loans/recommend",
      "/api/leads",
      "/api/leads/qualify",
      "/api/rag/search",
      "/api/chat",
      "/api/nba",
      "/api/schemes/match",
      "/api/documents",
      "/api/analytics",
    ],
  });
}
