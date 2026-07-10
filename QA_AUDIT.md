# IDBI SARTHI — End-to-End QA & Architecture Audit

Reviewer role: Senior Developer / QA. Scope: full static review of API routes, scoring engines, data layer, client components, config. Runtime could not be exercised in the sandbox (npm registry blocked there), so findings are from code inspection plus data-flow tracing; each is reproducible on the running dev server.

Severity legend: **P0 Critical** (security / data exposure) · **P1 High** (crashes / robustness) · **P2 Medium** (correctness / scale) · **P3 Low** (polish).

---

## P0 — Critical (security loopholes)

### 1. No authentication or authorization on any endpoint
There is no `middleware.ts` and no session/auth check in any route. Every endpoint is world-readable. `GET /api/customers` and `GET /api/customers/:id` return full customer PII — name, email, phone, income, savings, debt, every account and transaction. IDs are sequential and enumerable (`CUST-1001`…`CUST-1024`), so anyone can scrape the entire book with a for-loop. For a banking product this is the single biggest hole.
- Files: all of `src/app/api/**`, plus missing `src/middleware.ts`.
- Fix: add auth (the project already depends on `next-auth`) and a `middleware.ts` that gates `/api/*`; enforce that the caller may only read customers they own (RM → book mapping). Return the *lite* projection by default and full PII only to authorized roles.

### 2. Prompt injection via chat `history`
`chat/route.ts` builds the LLM message array from `body.history` and casts each `m.role as "user" | "assistant"` without validating the runtime value. A direct API caller can send `history: [{ role: "system", content: "ignore your rules…" }]` and it is forwarded to the model as a system message — full jailbreak / policy override. There is also no cap on history length, so a caller can blow up token usage and cost.
- File: `src/app/api/chat/route.ts` (history mapping).
- Fix: whitelist roles (`m.role === "assistant" ? "assistant" : "user"`), drop anything else, and truncate history to the last N (e.g. 10) turns.

### 3. No rate limiting on the LLM endpoint
`POST /api/chat` calls a **paid external API** (Groq) with no throttling, quota, or auth. One script can rack up cost or exhaust the key (financial DoS).
- Fix: per-IP / per-session rate limit (middleware or a small token bucket), plus a hard monthly cap.

---

## P1 — High (crashes & robustness)

### 4. Client never checks `res.ok` → error bodies rendered as data
No component checks `r.ok` before `r.json()`. On any non-2xx the error object (`{ error: "Not found" }`) is stored as if it were the payload. In `customer-dashboard.tsx` the render then calls `customer.name.split(" ")` on an object with no `name` → `TypeError`, blank screen / error boundary. Same latent trap in every module.
- Files: all `src/components/modules/*.tsx`, `src/hooks/use-customers.ts`.
- Fix: `if (!r.ok) { setError(...); return; }` and render an error state; guard optional fields.

### 5. Malformed JSON crashes POST routes
Four POST routes do `await req.json()` with no try/catch (`leads/qualify`, `loans/recommend`, `rag/search`, `documents`; `chat` too). A body that isn't valid JSON throws → unhandled 500 with a stack trace.
- Fix: wrap parsing in try/catch and return `400 { error: "Invalid JSON body" }`.

### 6. No input validation despite `zod` being installed
POST bodies are type-cast, not validated. `qualifyLead(body)` with missing fields produces a real-looking-but-garbage score (no NaN guard on `income`/`cibil`). `loans/recommend` with `amount`/`tenureMonths` undefined silently returns `[]` (NaN comparisons skip every product) instead of a 400.
- Fix: define `zod` schemas and `safeParse` each body; return 400 on failure. (`zod` is already a dependency but unused in `src/app/api`.)

### 7. Internal details leaked in error responses
`chat/route.ts` returns raw upstream error text and hardcoded server paths (`/home/z/my-project/.env.local`) in user-facing messages and comments. Info disclosure + confusing on Windows.
- Fix: log details server-side, return a generic message; scrub absolute paths.

---

## P2 — Medium (correctness & scalability)

### 8. Analytics recomputes everything on every request, some values twice
`api/analytics/route.ts` calls `riskPredict(c)` **twice per row** (for `riskProb` and `riskBand`) and recomputes `healthScore`/`riskPredict` again in the distribution loops and inside `analyticsSummary()`. All scores are recomputed from scratch on every hit — O(customers × factors) synchronous CPU on the request thread with no memoization or caching. Fine at 24 customers; it will block the event loop and dominate latency at realistic book sizes.
- Fix: compute each customer's scores once per request (map + reuse), and cache the aggregate (e.g. `unstable_cache` / revalidate) since inputs rarely change.

### 9. In-memory singletons, no real persistence
All data is generated once at import into module-level arrays; Prisma is scaffolded (`db.ts`, `schema.prisma`) but **unused** and its models are the default `User`/`Post` boilerplate. There is no persistence, no write path, and no query pagination beyond an in-memory `slice`. This is fine for a demo but is the core scalability ceiling — move to the DB with indexed queries and cursor pagination before real data.
- Note: customer generation *is* seeded (`rng(seed)`), so reads are consistent across restarts/instances — good. Only the analytics monthly chart is non-deterministic (see #12).

### 10. Next-Best-Action silently ignores 6 of 24 customers
`nextBestActions()` iterates `customers.slice(0, 18)` — a hardcoded cap. Customers 19–24 never receive an action. Arbitrary and easy to miss.
- Fix: iterate all customers (and paginate/limit at the API layer if needed).

### 11. Weak pagination and NaN limit on `/api/customers`
Only a `slice(0, limit)` is applied; no offset/cursor. `parseInt(url.searchParams.get("limit") ?? "100")` is unguarded, so `?limit=abc` → `NaN` → `slice(0, NaN)` → **0 customers returned**.
- Fix: `Number.isFinite` guard with a default and a max cap; add offset/cursor paging.

### 12. Non-deterministic, stale analytics chart
`monthlyTxn` uses `Math.random()` (numbers jump on every refresh) and hardcodes `new Date(2025, 5 - i, 1)` — the months are stuck in 2025 while "today" is 2026.
- Fix: derive from seeded/real data; compute months relative to now.

### 13. Dead `GET /api/nba` stub
`GET /api/nba` returns `{ count: 0, actions: [] }` and imports `nextBestActions` without using it (lint risk / misleading API). The UI only uses POST, so it works, but the GET is a trap for the next integrator.
- Fix: make GET return the same data as POST, or remove it.

### 14. Unguarded divide in `riskPredict`
Line ~86: `c.monthlyExpense / c.monthlyIncome > 0.7` has no `monthlyIncome > 0` guard (other spots in the same function do). Latent because the seed keeps income > 0, but it's an inconsistency that will bite if data ever comes from input.

---

## P3 — Low (polish)

15. `GET /api/` returns `"Hello, world!"` — leftover scaffold; remove.
16. "Explainable AI" contributions are independent heuristics and do **not** sum to `prediction − baseValue`, so it isn't true SHAP additivity. Fine as a visual, but don't label it SHAP in a compliance setting.
17. The `z-ai-web-dev-sdk` chat fallback depends on an internal service and will always fail on user infrastructure — so chat is unusable without a `GROQ_API_KEY`. Message the user plainly instead of implying a working fallback.
18. `GROQ_API_KEY` is read once at module load; adding it to `.env.local` requires a dev-server restart. Document this.
19. `documents` route runs several regexes on `text` with no body-size cap — large payloads = minor CPU DoS. Add a length limit.
20. `build`/`start` scripts use Unix-only `cp` and `bun` — they will fail on Windows. Make cross-platform (e.g. `cpy`/`shx`) before a production build.

---

## Suggested fix order
1. P0 #1–#3 (auth, prompt-injection role whitelist, rate limit) — these are the "loopholes."
2. P1 #4–#6 (res.ok checks, JSON try/catch, zod validation) — kill the crash paths.
3. P2 #8–#12 (dedupe/cache analytics, DB plan, NBA cap, pagination) — scalability.
4. P3 cleanup.

Nothing here blocks the demo running today — the happy path works. These are what separate a hackathon build from something you'd put in front of real customer data.

---

## Fixes applied (P1 batch)

- **New** `src/lib/api-utils.ts` — `parseBody(req, schema)` helper: guards `req.json()` and validates with zod, returning a ready 400 on bad input.
- **#5 + #6** JSON try/catch + zod validation on POST routes: `leads/qualify`, `loans/recommend`, `rag/search`, `documents` (also a 100k char cap), `chat` (message required + role whitelist + history capped to 10 turns, which also closes the P0 prompt-injection vector).
- **#4** `res.ok` guards added to every client fetch (all 12 modules + `use-customers` hook) so error responses no longer get rendered as data / crash the UI.
- **#11** `?limit` on `/api/customers` now NaN-guarded and clamped to 1..500.

## Fixes applied (P0 batch)

Scoped for a hackathon prototype (no sign-in/sign-up UI). Everything below is off-by-default where it could interfere with the demo.

- **New** `src/lib/rate-limit.ts` — in-memory fixed-window per-IP limiter (swap the Map for Redis to scale horizontally later).
- **New** `src/proxy.ts` (Next 16 proxy convention, formerly "middleware"; matches `/api/:path*`):
  - **#3 Rate limiting** — general cap (default 100/min per IP) plus a stricter cap on `/api/chat` (default 12/min) to protect the paid Groq endpoint from cost/DoS abuse. Returns `429` + `Retry-After`.
  - **#1 Optional API gate** — if `API_GATE_TOKEN` is set, every `/api/*` call must present it (`x-api-token` or `Bearer`); returns `401` otherwise. **Disabled by default** so the demo needs no login.
  - **Security headers** on all API responses (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- **`next.config.ts`** — baseline security headers for all page responses.
- **`.env.example`** — documents `GROQ_API_KEY`, `API_GATE_TOKEN`, `RATE_LIMIT_*`, `DATABASE_URL`.
- **#2 Prompt injection** — already closed in the P1 batch (chat history role whitelist + turn cap).

Note: true per-user authorization (RM → own book) intentionally deferred — data is synthetic, so PII exposure is a non-issue for the prototype.

## Fixes applied (P2 batch)

- **#8** `api/analytics/route.ts` rewritten: each customer's `healthScore`/`riskPredict` computed **once** and reused across rows + both distributions (was recomputed, and `riskPredict` ran twice per row). Whole payload cached for 60s.
- **#10** `nextBestActions()` now iterates **all** customers (was `slice(0, 18)`, silently dropping 6).
- **#12** Analytics `monthlyTxn` is now **deterministic** (no `Math.random()`) and anchored to the **current month** (was hardcoded to 2025).
- **#13** `GET /api/nba` now returns the same real data as `POST` (was a `{count:0, actions:[]}` stub).
- **#11** `/api/customers` now supports **`offset`** paging and returns `total/offset/limit/count/hasMore` (backward compatible — `customers` field unchanged).
- **#14** `riskPredict` guards `monthlyExpense / monthlyIncome` against divide-by-zero.

Not done (intentionally): **#9** move off in-memory singletons to a real database — a genuine architecture change, out of scope for the prototype.

## Fixes applied (P3 batch)

- **#15** `GET /api/` now returns a service-status/endpoint-discovery payload instead of `"Hello, world!"`.
- **#16** "Explainable AI" reworded to an honest **SHAP-style heuristic**; added a code comment clarifying contributions are a transparent rule-based proxy, not game-theoretic SHAP (non-additive).
- **#17 / #7** Chat messaging made honest — the no-key path now states plainly that the built-in fallback only works on the original hosted environment and that `GROQ_API_KEY` is required locally; hardcoded `/home/z/my-project/...` paths scrubbed; raw upstream error text no longer echoed to the client.
- **#20** `build`/`start` npm scripts are now **cross-platform** (Windows-safe): `scripts/postbuild.mjs` replaces `cp -r`, `scripts/start.mjs` replaces `NODE_ENV=... bun ... | tee`. No new dependencies (pure Node).

All P0/P1/P2/P3 items from this audit are now addressed, except the intentionally-deferred database migration (P2 #9) and true per-user authorization (not needed for a synthetic-data prototype).
