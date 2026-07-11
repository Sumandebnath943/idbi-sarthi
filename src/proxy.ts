// Edge middleware — first line of defense for every request.
//
//   1. Session gating   — unauthenticated /api/* → 401 JSON; unauthenticated
//                          pages → redirect to /login. (Handlers re-check too.)
//   2. Rate limiting     — keyed by authenticated user id (falls back to client
//                          IP), so it can't be bypassed by rotating X-Forwarded-For
//                          once logged in. Durable via Upstash when configured.
//   3. Security headers   — CSP (nonce-based), HSTS, frame/deny, etc.
//
// Uses the edge-safe authConfig (no bcrypt / no DB) so it bundles for the edge.

import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { rateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

const isDev = process.env.NODE_ENV !== "production";

const GENERAL_LIMIT = Number(process.env.RATE_LIMIT_GENERAL ?? "100");
const AI_LIMIT = Number(process.env.RATE_LIMIT_CHAT ?? "12");
const AUTH_LIMIT = Number(process.env.RATE_LIMIT_AUTH ?? "10");
const WINDOW_MS = 60_000;
const AI_PREFIXES = ["/api/chat", "/api/documents", "/api/rag"];

function clientIp(req: NextRequest): string {
  // On Vercel the platform sets x-forwarded-for / x-real-ip to the true client
  // and overwrites any client-supplied value, so the leftmost hop is trustworthy.
  // Behind a self-managed proxy, configure the trusted hop count instead.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.groq.com https://generativelanguage.googleapis.com https://*.supabase.co https://*.upstash.io${isDev ? " ws: wss:" : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

function applySecurity(res: NextResponse, csp: string): NextResponse {
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

const handler = auth(async (req) => {
  const { pathname } = req.nextUrl;
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const isApi = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isLogin = pathname === "/login";
  const loggedIn = !!req.auth?.user;

  // --- 1. Rate limiting (API + auth endpoints only) ---
  if (isApi) {
    const userId = req.auth?.user?.id;
    const key = userId ?? clientIp(req);
    let limit = GENERAL_LIMIT;
    let scope = "general";
    // Strict bucket only for actual sign-in attempts (brute-force protection),
    // not the frequent session/csrf/providers reads the client makes.
    if (pathname.startsWith("/api/auth/callback") || pathname.startsWith("/api/auth/signin")) {
      limit = AUTH_LIMIT;
      scope = "auth";
    } else if (AI_PREFIXES.some((p) => pathname.startsWith(p))) {
      limit = AI_LIMIT;
      scope = "ai";
    }
    const rl = await rateLimit(`${scope}:${key}`, limit, WINDOW_MS);
    if (!rl.ok) {
      const res = NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
      res.headers.set("Retry-After", String(rl.retryAfterSec));
      res.headers.set("RateLimit-Limit", String(rl.limit));
      res.headers.set("RateLimit-Remaining", "0");
      return applySecurity(res, csp);
    }
  }

  // --- 2. Session gating ---
  if (isApi && !isAuthApi && !loggedIn) {
    return applySecurity(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), csp);
  }
  if (!isApi && !isLogin && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return applySecurity(NextResponse.redirect(url), csp);
  }
  if (!isApi && isLogin && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return applySecurity(NextResponse.redirect(url), csp);
  }

  // --- 3. Pass through with nonce + security headers ---
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurity(res, csp);
});

// Support both the new `proxy` convention (Next 16.2+) and the default export.
export default handler;
export const proxy = handler;

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
