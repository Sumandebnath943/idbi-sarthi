import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Edge proxy (formerly "middleware") for all /api/* routes.
 *
 * Provides three P0 protections without requiring any login UI:
 *   1. Optional shared-token gate  — enabled only when API_GATE_TOKEN is set.
 *   2. Per-IP rate limiting        — general cap + a stricter cap on /api/chat.
 *   3. Security headers            — applied to every API response.
 *
 * By default (no env vars set) the gate is OFF so the demo works out of the box;
 * rate limiting and headers are always on.
 */

// --- Config (override via env) ---
const GATE_TOKEN = process.env.API_GATE_TOKEN ?? "";

const GENERAL_LIMIT = Number(process.env.RATE_LIMIT_GENERAL ?? "100"); // requests
const GENERAL_WINDOW_MS = 60_000; // per minute

const CHAT_LIMIT = Number(process.env.RATE_LIMIT_CHAT ?? "12"); // requests
const CHAT_WINDOW_MS = 60_000; // per minute (protects the paid LLM endpoint)

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = clientIp(req);

  // 1. Optional shared-token gate (only enforced when configured)
  if (GATE_TOKEN) {
    const provided =
      req.headers.get("x-api-token") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      "";
    if (provided !== GATE_TOKEN) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
  }

  // 2. Rate limiting (stricter for the LLM endpoint)
  const isChat = pathname.startsWith("/api/chat");
  const limit = isChat ? CHAT_LIMIT : GENERAL_LIMIT;
  const windowMs = isChat ? CHAT_WINDOW_MS : GENERAL_WINDOW_MS;
  const scope = isChat ? "chat" : "general";
  const rl = rateLimit(`${ip}:${scope}`, limit, windowMs);

  if (!rl.ok) {
    const res = NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rl.retryAfterSec));
    res.headers.set("RateLimit-Limit", String(rl.limit));
    res.headers.set("RateLimit-Remaining", "0");
    return withSecurityHeaders(res);
  }

  const res = NextResponse.next();
  res.headers.set("RateLimit-Limit", String(rl.limit));
  res.headers.set("RateLimit-Remaining", String(rl.remaining));
  return withSecurityHeaders(res);
}

export const config = {
  matcher: ["/api/:path*"],
};
