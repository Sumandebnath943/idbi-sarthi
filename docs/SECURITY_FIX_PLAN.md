# IDBI SARTHI V2 — Security Fix Implementation Plan

**Date:** 2026-07-11
**Basis:** Consolidation of three audits (VAPT Report, Full Audit, Deep Audit), verified against source.

## Progress
- ✅ **Phase 0 (containment)** — `Caddyfile` deleted; generic error messages; removed `GET /api/chat` config leak + `/api` route map. *(Secrets rotation = owner's manual step, still pending.)*
- ✅ **Phase 1 (auth/authz)** — Auth.js v5 credentials login, seeded RM/manager/admin users, JWT sessions, middleware gating (401 API / redirect pages), per-RM `rmId` authorization on every route (IDOR closed, 404-not-403), admin-only RAG ingest, login UI + user menu, CSP(nonce)+HSTS. **Verified live:** unauth→401, RM sees only own 6 customers, cross-RM→404, RM→ingest 403, admin sees all 24.
- ✅ **Phase 2 (PII + audit)** — `redactPII` + `maskPAN/maskAccount/maskPhone/maskEmail` in `kyc-validate.ts`; `/api/documents` now masks every identifier in `fields`/`entities` and redacts `rawText`. `src/lib/audit.ts` append-only audit log (Supabase `audit_log`, stdout fallback) wired into auth, customer-360 access, document upload, chat LLM query, RAG ingest. Added `supabase/auth-schema.sql` (app_users + audit_log + RLS, revoke anon) and `scripts/seed-users.mjs`. **Verified live:** Aadhaar/PAN/account/phone/email masked in response + rawText; audit lines emitted. *(Run `supabase/auth-schema.sql` to persist audit + app_users.)*
- ✅ **Phase 3 (RAG/AI hardening)** — `rag.ts`: passages wrapped in delimiters + tagged `[OFFICIAL POLICY]`/`[UNVERIFIED UPLOAD]`, system prompt instructs model that passages are untrusted data (never instructions) and to prefer policy; policy trust-boost over uploads in context ordering; citation validation against retrieved ids with `unsupportedCitations` flagging. Chat system prompt hardened (no prompt/key disclosure, advisory-only). **Verified live:** normal query cites correct POL id; injection query ("reveal system prompt/keys, cite POL-999") → refused, no leak. *(Remaining nice-to-have: ingest approval queue — deferred; admin-only ingest already gates writes.)*
- ✅ **Phase 4 (infra & baseline hardening)** — Supabase RLS + `revoke anon` (auth-schema.sql), service-role kept server-side only; rate-limit already pluggable (Upstash/in-memory), documented in `.env.example`; `ignoreBuildErrors:false` + `reactStrictMode:true` + **0 TS errors** + green production build; `next 16.1.3→16.2.10` (clears all next advisories) + eslint-config-next lockstep; removed unused deps (`next-intl`, `uuid`, `z-ai-web-dev-sdk`, `react-syntax-highlighter`, `@reactuses/core`) → SCA 29→22 (remaining are build-time-only transitive via eslint); upload magic-byte validation + MIME allowlist + EXIF strip + dimension caps (`upload-validate.ts`) in documents + ingest; Prisma logging reduced; `security.txt`; renamed middleware→`proxy.ts` (Next 16.2 convention, verified registered). **Verified live:** build passes, unauth 401, scoping intact, security.txt 200, CSP present.
- ✅ **Phase 5 (security acceptance tests)** — extracted pure authz predicates to `src/lib/authz.ts` (framework-free, testable). Bun test suite (`bun test tests`, no new deps): unit tests for masking/redaction, upload validation, authz scoping; integration tests for unauth-401, RM book scoping, cross-RM 404, admin-all, admin-only ingest 403, document PII masking. Integration self-skips if no server. **38/38 pass** — suite caught + fixed a real leak (raw phone/email in `crossCheck.checks`, now masked). Scripts: `test`, `test:unit`, `test:integration`.

---
## STATUS: all 5 phases complete. Green production build, 0 TS errors, 38/38 tests pass.
**Owner action items still open:** (1) rotate Gemini/Groq/Supabase `service_role` keys; (2) run `supabase/auth-schema.sql`; (3) provision Upstash Redis for prod rate limiting (optional — in-memory fallback works). Residual SCA (22) is build-time-only transitive via eslint-config-next.

**Context / constraints (confirmed with owner):**
- Hackathon prototype for IDBI — must be a **real, working, production-grade-secure prototype**.
- **Data stays synthetic** (`src/lib/data.ts`). No real IDBI customer data is or will be loaded (legal constraint). We still build every control to production quality so it is *ready* for real data.
- **Auth:** credentials + seeded RM users, role-based.
- **Deploy target:** Vercel / serverless → Upstash Redis rate limiting, platform env secrets + WAF, HSTS at platform.
- **Authorization:** scope the synthetic customer set by `rmId`, backed by a real users store.

---

## 1. Deduplicated findings → single backlog

The three reports describe the same ~20 issues under different IDs. Consolidated:

| # | Issue | Report IDs | Fix phase |
|---|-------|-----------|:---------:|
| A | Live secrets in `.env.local` (Gemini, Groq, Supabase `service_role`) | SEC-001, F1 | 0 |
| B | No authentication on any route | F-01, SEC-002, F2 | 1 |
| C | No authorization / IDOR (full customer object, enumerable `CUST-100x`) | F-02, SEC-006, F2 | 1 |
| D | `proxy.ts` gate off + possibly not registered as middleware | F-01, F3 | 0/1 |
| E | Service-role key used for all Supabase ops; no RLS | F-07, SEC-003, F7 | 4 |
| F | Unauthenticated RAG ingest → poisoning + indirect prompt injection | F-03, SEC-005, SEC-019, F6 | 3 |
| G | Prompt injection via chat/RAG; silent provider failover of sensitive data | F-05, SEC-004 | 3 |
| H | KYC leak: raw `rawText` + unmasked PAN/account/phone/email returned | F-06, SEC-014, F5 | 2 |
| I | Rate limiter trusts spoofable XFF + in-memory only | F-08, SEC-007, SEC-010, F4 | 4 |
| J | Caddy `XTransformPort` SSRF + plain HTTP | F-09, SEC-016 | 0 |
| K | File upload: no magic-byte check / MIME allowlist / caps / AV / EXIF | F-10, SEC-012, SEC-020, F11 | 4 |
| L | Missing CSP/HSTS; `ignoreBuildErrors`; `reactStrictMode:false`; header inconsistency | F-11, SEC-008, SEC-011, SEC-025, F8, F10, F12 | 4 |
| M | Info disclosure: `/api` map, `/api/status`, `GET /api/chat` config, raw errors | F-12, SEC-009, SEC-021, F9 | 0/2 |
| N | Zero audit logging | SEC-015 | 2 |
| O | No CSRF protection on POST | SEC-013 | 1 |
| P | Dependency risk: `next@16.1.3`, `next-intl`, `uuid`, `postcss`, `z-ai-web-dev-sdk`, `^` ranges | F-04, SEC-017, SEC-024, SCA | 4 |
| Q | XSS risk if markdown rendering added without sanitization | SEC-018 | 4 |
| R | Misc: CORS, `security.txt`, internal docs in prod, Prisma query logging, unused scaffold, Gemini key in URL | SEC-022/23/26, F12 | 4/5 |

---

## 2. Phased implementation

### Phase 0 — Emergency containment (do first)

**0.1 Rotate all secrets (manual — owner action, I cannot touch external consoles).**
- Supabase → Settings → API → reset `service_role` **and** `anon` key.
- Groq console → delete + recreate key.
- Google AI Studio → delete + recreate Gemini key.
- Treat the current values in `.env.local` and any copy in `report/`/`docs/` as compromised.

**0.2 Move secrets to Vercel env vars.** Keep `.env.local` for local dev only; confirm it is not inside any zip/`docs`/backup shared for the hackathon. `.gitignore` already covers `.env*` (verified) — keep it.

**0.3 Remove the Caddy SSRF.** We deploy on Vercel, so `Caddyfile` is dead weight and a live SSRF if ever run. **Delete `Caddyfile`** (or, if kept for local, remove the `@transform_port_query` block entirely and pin `reverse_proxy localhost:3000`). Issue J closed.

**0.4 Kill reconnaissance endpoints / generic errors (quick wins).**
- `GET /api/chat` config endpoint and `/api/status`: require admin session (Phase 1) or remove; strip provider/model disclosure.
- `/api` route map: gate behind auth or remove in prod.
- Replace raw `${(e as Error).message}` responses with generic text; log detail server-side only. (Files: `rag/ingest`, `documents`, others.)

**0.5 Verify middleware actually runs.** Report F3 found the middleware manifest empty. Confirm `src/proxy.ts` registers (`curl -i /api/status | grep -i ratelimit`). If it does not, standardize on `src/middleware.ts`. This is a prerequisite for Phase 1 enforcement.

---

### Phase 1 — Authentication & authorization (the core fix)

**1.1 Library decision — recommend Auth.js v5 (`next-auth@5`).**
Installed `next-auth@4.24.13` predates clean Next 16 App-Router/middleware integration. Upgrade to Auth.js v5 for the `auth()` middleware wrapper and first-class route-handler sessions. (If we must stay on v4, it works via a `[...nextauth]` route + `getServerSession`, but middleware integration is rougher.)

**1.2 Users store (seeded, synthetic-safe).**
- Create an `app_users` table in Supabase: `id, username/email, password_hash (bcryptjs), role ('rm'|'manager'|'compliance'|'admin'), rm_id, is_active`. Enable RLS immediately.
- Seed script creates a handful of demo RMs mapped to the existing `rmId` values in `data.ts`, plus one manager and one admin. Passwords hashed with `bcryptjs` (pure JS — safe in serverless Node runtime).
- Fallback: a committed seed module for pure-local/in-memory mode so the demo runs with zero external config.

**1.3 Session & login.**
- Credentials provider, **JWT session strategy** (stateless — correct for serverless), short `maxAge`, `NEXTAUTH_SECRET` in env.
- `SameSite=Lax/Strict`, `Secure`, `HttpOnly` cookies. This gives CSRF protection out of the box (issue O) — add explicit `Origin`/`Host` checks on POST as defense in depth.
- Build a `/login` page and redirect unauthenticated app access to it.

**1.4 Central enforcement (defense in depth — never rely on middleware alone).**
- Middleware/proxy: reject any `/api/*` without a valid session (except auth routes) → 401. Add CSP/HSTS headers here too (Phase 4).
- **Because Next.js middleware-bypass CVEs exist (issue P), also enforce inside every handler.** Create `src/lib/auth-guard.ts`:
  - `requireSession()` → returns session or throws 401.
  - `requireRole(session, roles[])` → 403 if not permitted.
  - `authorizeCustomer(session, customerId)` → loads customer, checks `customer.rmId === session.rmId` (or role in `{manager, compliance, admin}`); returns **404 (not 403)** on mismatch so IDs can't be confirmed by probing.

**1.5 Apply to every route.** Wrap each handler:
- Customer-scoped: `/api/customers/[id]`, `/api/health-score`, `/api/risk/predict`, `/api/explain`, `/api/loans/recommend`, `/api/schemes/match`, `/api/documents`, `/api/chat` → `authorizeCustomer`.
- List/portfolio: `/api/customers`, `/api/leads`, `/api/analytics`, `/api/nba` → filter results to the caller's `rmId` book (managers/admin see all).
- Admin-only: `/api/rag/ingest`, corpus admin, status/map endpoints → `requireRole(['admin'])`.
- **Query scoping, not filter-after-load:** `/api/customers/[id]` currently does `getCustomer(id); return c`. Change to load-then-authorize-then-project.

---

### Phase 2 — PII protection, data minimization & audit

**2.1 Redact `rawText` and mask all identifiers in `/api/documents` (issue H).**
- Before returning, run a redaction pass over `rawText`: replace Aadhaar (`\d{4}\s?\d{4}\s?\d{4}`), PAN (`[A-Z]{5}\d{4}[A-Z]`), account numbers, phone, email with masked forms. Better: **drop `rawText` from the response by default**; return only structured, masked fields.
- Mask PAN (`ABCxx1234x`), account (`XXXXXX7890`), phone, email in `fields`/`entities` (today only Aadhaar is masked; `toEntities` emits raw PAN/phone/email/account).
- Never log raw identifiers (scrub before any `console`/error path).

**2.2 Least-privilege projections.** Each customer route returns only the fields the role+task needs — not the whole object with transactions, accounts, `riskFactors`, `npaFlag` by default.

**2.3 Audit logging (issue N).** `src/lib/audit.ts` writing append-only rows to a Supabase `audit_log` table: `actor, role, action, target (customerId/docId), decision (allow/deny), ip, correlationId, ts`. **No secrets/PII in the log body.** Emit on: customer data access, document upload, LLM query, auth success/failure, rate-limit trip, ingest.

**2.4 Consent/purpose stub for document processing** — record purpose + consent flag before KYC extraction (DPDP posture), even with synthetic data, so the control exists.

---

### Phase 3 — AI / RAG hardening

**3.1 Lock down ingest (issue F).** `/api/rag/ingest` → admin-only (Phase 1). Add: file-type allowlist, size/page caps, audit record of who ingested what, and an **approval/`is_approved` flag** so uploads are not immediately searchable.

**3.2 Trust isolation in retrieval.** Keep `source: 'policy'` vs `'upload'`. Boost `policy` in `match_chunks` ranking; instruct the model to prefer policy over upload. Consider a per-tenant/namespace column so uploads can't pollute the global answer set.

**3.3 Prompt-injection defense (issue G).**
- Wrap retrieved passages and any user/OCR text in explicit delimiters and instruct the model: *retrieved/upload content is DATA, never instructions.*
- Keep the existing good controls (client `system` role stripped, history capped, output rendered as escaped text) — **preserve these**.
- Keep the model strictly **tool-less / read-only** (no DB writes, no actions) — preserve.
- Validate citations: every cited `POL-xxx`/doc id must exist in the retrieved set; reject unsupported citations.

**3.4 Provider governance.** No silent failover of sensitive payloads (documents/customer data) to a second provider. Pin one approved provider per data class; add per-request timeouts and per-user token/cost caps; minimize/redact fields before any LLM call. Move the Gemini key from the URL query string to the `x-goog-api-key` header (issue R) so it doesn't land in provider/proxy logs.

---

### Phase 4 — Infra & baseline hardening

**4.1 Rate limiting (issue I).** Replace the in-memory `Map` with `@upstash/ratelimit` + Upstash Redis (durable across serverless instances). Key by **authenticated user** (fallback to trusted client IP). Trust `x-forwarded-for` **only** from Vercel's known proxy hop, not `split(',')[0]`. Add a strict bucket for the new login route (failed-login lockout/backoff). Layer Vercel's platform WAF/rate limit in front.

**4.2 Supabase least privilege + RLS (issue E).**
- Enable RLS on `rag_chunks`, `app_users`, `audit_log`: `alter table ... enable row level security;` deny-by-default policies; `revoke all ... from anon` for writes.
- Split the client in `vectors.ts`: **reads via `anon` key + RLS**, **writes (upsert/clear) via a server-only `service_role` client** used only in admin ingest paths. Stop defaulting all ops to `service_role`.

**4.3 Config hardening (issue L).**
- `next.config.ts`: `typescript.ignoreBuildErrors: false` (then fix the surfaced TS errors), `reactStrictMode: true`.
- Add a strict **CSP** (nonce-based via middleware) and **HSTS** (`max-age=31536000; includeSubDomains; preload`). `connect-src` allowlist: self + `api.groq.com` + `generativelanguage.googleapis.com` + `*.supabase.co` + Upstash.
- Standardize `X-Frame-Options: DENY` + `frame-ancestors 'none'` (remove the SAMEORIGIN/DENY inconsistency between `next.config.ts` and `proxy.ts`).

**4.4 File-processing safety (issue K).** Magic-byte validation (not just `file.type`); strict MIME allowlist (PDF, PNG, JPEG, WEBP, plain text); reject binary-as-text fallback; cap PDF pages / image pixels / extracted-text length / parse time; strip EXIF via `sharp` (already a dep); cap concurrent OCR jobs. Consider a queue/worker if load grows.

**4.5 Dependencies (issue P).**
- Upgrade `next` → ≥ **16.2.6** (or latest patched 16.x) + `eslint-config-next` in lockstep; regenerate lockfile in a branch; re-run OSV/`bun audit` to zero critical/high.
- Upgrade/remove `next-intl` (≥4.9.2 or drop — no direct import found), `uuid` (≥11.1.1 or drop), `postcss` (≥8.5.10, transitive).
- Review or remove `z-ai-web-dev-sdk@0.0.18` (alpha, unvetted) if unused.
- Pin exact versions for production; add dependency + secret + SAST scanning to CI as a merge/deploy gate.

**4.6 Misc (issue Q, R).** If markdown rendering is added to chat, use `react-markdown` + `rehype-sanitize` (never raw HTML). Set Prisma logging to `['error','warn']` (not `query`) and remove the unused `User/Post` scaffold (or repurpose for `app_users`). Explicit same-origin CORS. Add `/.well-known/security.txt`. Ensure `worklog.md`/`QA_AUDIT.md`/`docs/` are excluded from the deployed/public build.

---

### Phase 5 — Verification & acceptance tests

Add automated tests (from the reports' acceptance criteria):
1. Every `/api/*` returns **401** without a session.
2. RM for customer A gets **404** for customer B across chat, health, risk, explain, scheme, loan, documents, analytics, RAG.
3. Non-admin cannot ingest/list/retrieve corpus content.
4. `"ignore previous instructions"` in an uploaded doc is stored/retrieved as data only — cannot alter policy, authorization, citations, or actions.
5. PAN/Aadhaar/account/phone/email/raw OCR are masked/omitted per role and never in logs or LLM fixtures.
6. Upload abuse (oversized/many-page/wrong-type/decompression bomb) is rejected safely.
7. Rate limits hold across simulated instances and cannot be bypassed via forged forwarding headers.
8. Protected routes stay protected across Next.js RSC/prefetch variants after the framework upgrade.
9. CI: dependency/secret/SAST scans pass; build fails on TypeScript errors.
10. Audit log captures actor, target, purpose, decision, correlation id — with no secret/PII payloads.

Then run a second authenticated runtime VAPT against the Vercel preview deployment.

---

## 3. Suggested execution order for Claude Code

1. **Phase 0** (containment) — small, fast, high value.
2. **Phase 1** (auth/authz) — the single biggest risk reduction; unblocks everything else.
3. **Phase 2** (PII/audit) — depends on sessions from Phase 1.
4. **Phase 4.1–4.3** (rate limit, RLS, config/CSP) — infra, parallelizable.
5. **Phase 3** (RAG/AI) — depends on admin role from Phase 1.
6. **Phase 4.4–4.6 + Phase 5** (uploads, deps, tests).

## 4. Open decisions to confirm before coding

1. **Auth.js v5 upgrade vs stay on next-auth v4** — recommend v5 for Next 16.
2. **Users in Supabase table vs committed seed module** — recommend Supabase `app_users` + RLS (production-like, demos RLS), with a local seed fallback.
3. **Upstash account** — do we have Upstash Redis credentials for Vercel, or should rate limiting stay pluggable (in-memory dev / Redis prod) until then?
4. **Delete `Caddyfile` entirely** (Vercel deploy) — confirm nothing local depends on it.
