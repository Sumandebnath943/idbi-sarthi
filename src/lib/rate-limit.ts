// Pluggable rate limiter.
//   - Upstash Redis (durable, multi-instance, sliding window) when
//     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (prod / Vercel).
//   - In-memory fixed-window fallback for zero-config local dev.
//
// Edge-safe: both backends run in the middleware (edge) runtime.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
};

// ---- In-memory fallback (single instance / dev only) ----
type Bucket = { count: number; resetAt: number };
const memStore = new Map<string, Bucket>();
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of memStore) if (b.resetAt <= now) memStore.delete(k);
}
function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = memStore.get(key);
  if (!existing || existing.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, retryAfterSec: 0 };
  }
  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, limit, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true, limit, remaining: limit - existing.count, retryAfterSec: 0 };
}

// ---- Upstash Redis (durable, distributed) ----
let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

const limiters = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const cacheKey = `${limit}:${windowMs}`;
  let l = limiters.get(cacheKey);
  if (!l) {
    l = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "idbi-rl",
      analytics: false,
    });
    limiters.set(cacheKey, l);
  }
  return l;
}

/**
 * @param key      unique caller key (prefer authenticated user id, else client IP)
 * @param limit    max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return memRateLimit(key, limit, windowMs);
  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      ok: success,
      limit,
      remaining: Math.max(0, remaining),
      retryAfterSec: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch {
    // If Redis is unreachable, fail open to the in-memory limiter rather than 500.
    return memRateLimit(key, limit, windowMs);
  }
}
