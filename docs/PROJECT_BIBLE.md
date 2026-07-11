# IDBI SARTHI — Project Bible

> The single source of truth for **what** IDBI SARTHI is, **how** it works, and **why** it's built the way it is.
> For getting-started/ops, see [`HANDOFF.md`](./HANDOFF.md). For demo/marketing, see [`EXPLAINER_VIDEO.md`](./EXPLAINER_VIDEO.md).

---

## Table of contents
1. [Product overview](#1-product-overview)
2. [Personas & use cases](#2-personas--use-cases)
3. [The 12 modules](#3-the-12-modules)
4. [Data model & synthetic dataset](#4-data-model--synthetic-dataset)
5. [Deterministic engines](#5-deterministic-engines)
6. [RAG Knowledge Base — architecture](#6-rag-knowledge-base--architecture)
7. [Document Intelligence — architecture](#7-document-intelligence--architecture)
8. [AI provider layer](#8-ai-provider-layer)
9. [Persistence (Supabase pgvector)](#9-persistence-supabase-pgvector)
10. [API reference](#10-api-reference)
11. [Security & infrastructure](#11-security--infrastructure)
12. [Tech stack & dependencies](#12-tech-stack--dependencies)
13. [Directory map](#13-directory-map)
14. [Design system](#14-design-system)
15. [Deployment architecture](#15-deployment-architecture)
16. [Decision log](#16-decision-log)
17. [Roadmap](#17-roadmap)
18. [Glossary](#18-glossary)

---

## 1. Product overview

**IDBI SARTHI** = **S**mart **A**I **R**elationship & **T**rust **H**ub **I**ntelligence. It's a copilot that sits beside an IDBI Bank **Relationship Manager (RM)** and turns scattered customer data + bank policy into fast, explainable decisions and next actions.

It bundles **12 modules** into a single-page app grouped into four domains:

- **Customer** — Customer 360, Financial Health Score, Lead Qualification
- **Decisioning** — Loan Recommendation, Risk Prediction, Explainable AI
- **Assistant** — RAG Knowledge Base, RM Chat, Next Best Action
- **Operations** — Government Scheme Matcher, Document Intelligence, Analytics

**Design philosophy:** the numeric/decisioning engines are **deterministic and explainable** (no black-box LLM for scoring); LLMs are used only where language understanding genuinely helps — **chat, RAG answers, and document reading**.

---

## 2. Personas & use cases

**Primary persona — the Relationship Manager.** Manages a book of retail/priority/wealth customers; needs to spot risk, cross-sell appropriately, answer policy questions, verify KYC documents, and know the next best action per customer.

Representative jobs-to-be-done:
- "Give me a 360° view of this customer and their risk signals."
- "What's their financial health, and why?"
- "Which loan fits, at what rate/EMI, and are they eligible?"
- "What documents and CIBIL are needed for a home loan?" (policy Q&A)
- "Is this uploaded PAN/salary slip valid and does it match the customer on file?"
- "What should I do next for this customer, and by when?"

---

## 3. The 12 modules

Registry: [`src/lib/modules.ts`](../src/lib/modules.ts). UIs: [`src/components/modules/`](../src/components/modules/). Rendered by a client-side switcher in [`src/app/page.tsx`](../src/app/page.tsx) (no routing — local state).

| # | Module | Group | What it does | Backed by |
|---|---|---|---|---|
| 1 | Customer 360 Dashboard | Customer | Unified profile, accounts, transactions, risk signals | `getCustomer`, data |
| 2 | Financial Health Score | Customer | 0–900 weighted score, 6-factor breakdown, radar + gauge | `healthScore()` |
| 3 | Lead Qualification | Customer | ML-style scoring form + Kanban pipeline | `qualifyLead()` |
| 4 | Loan Recommendation | Decisioning | Multi-product matcher, rate & EMI, eligibility reasons | `recommendLoans()` |
| 5 | Risk Prediction | Decisioning | 12-mo default probability, SMA staging, driver attribution | `riskPredict()` |
| 6 | Explainable AI | Decisioning | Per-feature contribution (SHAP-*style* heuristic) | `explainDecision()` |
| 7 | **RAG Knowledge Base** | Assistant | Hybrid retrieval + grounded, cited policy answers + upload | RAG pipeline |
| 8 | RM Chat | Assistant | LLM copilot with customer + policy context | `/api/chat` |
| 9 | Next Best Action | Assistant | Prioritized proactive actions across all customers | `nextBestActions()` |
| 10 | Government Scheme Matcher | Operations | Eligibility match across 8 govt schemes | `matchSchemes()` |
| 11 | **Document Intelligence** | Operations | Upload → OCR → extract → validate → verify vs customer | Doc pipeline |
| 12 | Analytics Dashboard | Operations | Portfolio KPIs, distributions, trends, RM leaderboard | `/api/analytics` |

Modules 7 and 11 (bold) are the ones rebuilt from mocks into real AI; the rest are deterministic.

---

## 4. Data model & synthetic dataset

Source: [`src/lib/data.ts`](../src/lib/data.ts). All data is **deterministic** (seeded RNG), generated once at import, so reads are stable across restarts.

**Volumes:** 24 customers · 16 leads · 8 policies (`POL-001…008`) · 8 government schemes (`SCH-001…008`) · 5 loan products · 4 RMs.

**Key types (abridged):**

- `Customer` — `id, name, age, email, phone, city, segment (Retail|Priority|Wealth|NRI), kycStatus, monthlyIncome, monthlyExpense, totalSavings, totalInvestments, outstandingDebt, creditUtilization, creditLimit, emiBurden, numProducts, numTransactions30d, digitalEngagement, npaFlag, accounts[], transactions[], riskFactors[]`
- `Lead` — `id, name, source, product, estimatedValue, score, stage, assignedRm, lastContact`
- `Policy` — `id, title, category (Lending|Compliance|Risk|Customer Service|Wealth Mgmt), summary, content, tags[], version, effectiveDate`
- `Scheme`, `LoanProduct`, `RM` — see file.

Helper: `getCustomer(id)`, `getRM(id)`.

> There is **no real PII** — everything is synthetic. This is why authorization is deferred (see §11 and the Decision Log).

---

## 5. Deterministic engines

All in [`src/lib/scoring.ts`](../src/lib/scoring.ts). Pure functions; no LLM.

- **`healthScore(c)`** → 0–900. Weighted sum of 6 normalized factors: Savings Ratio (0.22), Credit Utilization (0.20), EMI Burden (0.18), Financial Stability (0.18), Digital Engagement (0.12), Product Diversification (0.10). Band: Excellent ≥720, Good ≥600, Fair ≥480, else Poor.
- **`riskPredict(c)`** → 12-month PD (base 0.05, additive drivers for high utilization, EMI burden, expense ratio, inactivity, NPA flag; reduced by a strong emergency fund), clamped 0.02–0.85. Band Low/Moderate/High/Critical; SMA staging None→SMA-0/1/2→NPA; recommendation text.
- **`recommendLoans(c, amount, tenureMonths)`** → ranked products with a 20–98 match score, estimated CIBIL, rate, and EMI (standard amortization), plus human-readable eligibility reasons.
- **`qualifyLead(input)`** → 5–99 score from income/CIBIL/age/relationship/interest/source; maps to stage.
- **`explainDecision(c)`** → Approve/Review/Decline with per-feature contributions (transparent rule-based proxy, **explicitly not** game-theoretic SHAP).
- **`nextBestActions()`** → prioritized NBAs across **all** customers (risk outreach, wealth review, card cross-sell, digital onboarding, senior-citizen scheme, routine review) with channel, priority P0–P3, expected uplift, deadline.
- **`matchSchemes(c)`** → per-scheme match score with matched/missing criteria.
- **`analyticsSummary()`** — portfolio aggregates (AUM, avg health, high-risk count, distributions, RM leaderboard).

---

## 6. RAG Knowledge Base — architecture

The pipeline: **ingest → chunk → embed → store → hybrid-retrieve → generate (grounded, cited)**.

**Ingestion & chunking** — [`src/lib/ingest.ts`](../src/lib/ingest.ts)
- `chunkText()` splits into ~110-word, sentence-bounded windows with 1-sentence overlap, carrying a section label for citations.
- `ingestDocument()` chunks → embeds → `vectorStore.upsert()`.
- `ensureSeeded()` seeds the 8 built-in policies once (memoized). The 8 policies produce **9 chunks**.

**Embeddings** — [`src/lib/embeddings.ts`](../src/lib/embeddings.ts)
- Provider-driven: **Gemini `gemini-embedding-001` at 768-dim** (default when key present), else local transformers.js `all-MiniLM-L6-v2` (384-dim). Vectors are L2-normalized (cosine == dot).

**Vector store** — [`src/lib/vectors.ts`](../src/lib/vectors.ts)
- `VectorStore` interface (async). `InMemoryVectorStore` (cosine scan) for dev; `SupabaseVectorStore` (pgvector `match_chunks` RPC) for prod. Selected by env.

**Hybrid retrieval** — [`src/lib/retrieval.ts`](../src/lib/retrieval.ts)
- Runs two rankers and fuses with **Reciprocal Rank Fusion (RRF, k=60)**:
  1. **Semantic** — cosine over embeddings (catches paraphrase).
  2. **Keyword** — TF-style, title-weighted (catches exact IDs / rare terms).
- Degrades to keyword-only if embeddings are unavailable.

**Generation** — [`src/lib/rag.ts`](../src/lib/rag.ts)
- `answerQuery()` retrieves top-k, then asks the LLM to answer **only** from the passages, cite every claim as `[POL-xxx]`, and reply `NO_ANSWER` if unsupported. Citations are derived from the `POL-xxx` tokens the model actually used. Without an LLM key, it returns ranked passages and says so (honest fallback).

**Upload** — `POST /api/rag/ingest` + a UI control; PDF (via `unpdf`), TXT, or image (via Tesseract) → same index.

---

## 7. Document Intelligence — architecture

Pipeline: **upload → extract → validate → cross-check → compliance flags**.

**Extraction** — [`src/lib/doc-extract.ts`](../src/lib/doc-extract.ts)
- **Image** → Gemini vision (OCR + classification + structured JSON in one call); on failure → Tesseract.js OCR → LLM/regex structuring.
- **PDF** → `unpdf` text; scanned PDFs (no text) prompt for an image upload.
- **Text** → LLM structuring (JSON mode), else regex.
- Output: `documentType` (Aadhaar/PAN/Bank Statement/Salary Slip/ITR/Cheque/Unknown) + fields (name, dob, PAN, Aadhaar, address, phone, email, account, IFSC, employer, gross/net pay, amounts, dates) + confidence + `method` (e.g. `gemini-vision`, `groq-text`, `tesseract+regex`).

**Validators (deterministic, always run)** — [`src/lib/kyc-validate.ts`](../src/lib/kyc-validate.ts)
- **PAN** format + holder-type char.
- **Aadhaar** 12-digit + **Verhoeff checksum** (real algorithm) + first-digit rule.
- **IFSC** format.
- **Masking** — Aadhaar is masked (`XXXX-XXXX-1234`) **before** it ever leaves the server.

**Customer-360 cross-check** — `crossCheckCustomer()` compares extracted name / phone / email / city / income against the on-file `Customer` and returns a verdict: **Match / Partial Match / Mismatch / Insufficient Data**, with a per-field table. This is the piece that makes it a *banking* KYC feature rather than a toy OCR.

**Compliance flags** — Aadhaar masking notice, PAN+phone DPDP-consent note, tamper heuristics, low-confidence review prompt, and the cross-check verdict.

---

## 8. AI provider layer

Roles are split by capability because **no single provider does all three well**:

| Role | Primary | Fallback | Why |
|---|---|---|---|
| Text (chat, RAG answers, doc text-extract) | **Groq `openai/gpt-oss-120b`** | Gemini `gemini-flash-lite-latest` | Groq: stronger, faster, generous free tier |
| Vision (document images) | **Gemini `gemini-flash-lite-latest`** | Tesseract.js | Groq has **no production vision model** |
| Embeddings | **Gemini `gemini-embedding-001` @768** | local MiniLM @384 | Groq has **no embeddings endpoint** |

- **`src/lib/llm.ts`** — `llmComplete(messages, opts)` tries providers in order; **vision requests are forced to Gemini-first**. `LLM_PROVIDER` env flips the text order. `activeLlmProvider()` powers status.
- **`src/lib/gemini.ts`** — REST: `generateContent` (text + `inline_data` vision), `embedContent` (fanned out with concurrency 5; `outputDimensionality:768`).
- **`src/lib/groq.ts`** — REST: OpenAI-compatible chat completions, JSON mode, `parseJsonReply`.

---

## 9. Persistence (Supabase pgvector)

Schema: [`supabase/schema.sql`](../supabase/schema.sql) (documented) / [`supabase/reset.sql`](../supabase/reset.sql) (clean drop-and-recreate to run).

- Table **`rag_chunks`**: `id (pk), doc_id, doc_title, source, category, section, page, content, tokens, embedding vector(768), created_at`.
- Indexes: `doc_id`, and an **ivfflat** cosine index on `embedding`.
- RPC **`match_chunks(query_embedding vector(768), match_count int)`** → returns rows + `score = 1 - (embedding <=> query_embedding)`, ordered by distance.
- After DDL, `notify pgrst, 'reload schema';` refreshes PostgREST's cache.

Selection: `SUPABASE_URL` + a key ⇒ Supabase; otherwise in-memory. The dimension **must** match the embedding provider (768 Gemini / 384 local) — `instrumentation.ts` warns on mismatch.

---

## 10. API reference

All under `src/app/api/`. Non-AI routes are thin wrappers over `scoring.ts`.

| Method & path | Purpose |
|---|---|
| `GET /api/status` | Active LLM/embeddings/vector providers + display label |
| `GET /api/customers?limit&offset` | Paginated lite customer list (`total/offset/limit/hasMore`) |
| `GET /api/customers/:id` | Full customer |
| `POST /api/health-score` · `/api/risk/predict` · `/api/explain` | Per-customer engines |
| `POST /api/loans/recommend` | Loan matcher (zod-validated body) |
| `POST /api/leads/qualify` · `GET /api/leads` | Lead scoring + list |
| `POST\|GET /api/rag/search` | Hybrid retrieval + grounded cited answer |
| `POST /api/rag/ingest` | Upload a policy (multipart) → index |
| `POST /api/documents` | Document Intelligence (multipart file or JSON text) |
| `POST\|GET /api/chat` | RM chat (POST) / provider status (GET) |
| `POST\|GET /api/nba` | Next Best Actions |
| `POST /api/schemes/match` | Scheme eligibility |
| `GET /api/analytics` | Portfolio aggregates (cached 60s) |

**Validation:** POST bodies use `zod` via `parseBody()` ([`src/lib/api-utils.ts`](../src/lib/api-utils.ts)) → 400 on bad input. Chat sanitizes history (drops client `system` roles → prevents prompt injection; caps to 10 turns).

---

## 11. Security & infrastructure

Edge proxy: [`src/proxy.ts`](../src/proxy.ts) (Next 16 "proxy" convention, matches `/api/:path*`):
- **Rate limiting** (in-memory fixed window, [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts)): 100/min general; **12/min** for the AI endpoints (`/api/chat`, `/api/documents`, `/api/rag`) to protect paid LLM calls. Returns `429 + Retry-After`.
- **Optional token gate:** if `API_GATE_TOKEN` is set, every `/api/*` must present `x-api-token`/`Bearer`. Off by default.
- **Security headers** on API responses; baseline headers on pages via `next.config.ts`.

**Deferred:** true per-user auth (RM → own book). Data is synthetic, so PII exposure is a non-issue today — **add auth before real data.** `next-auth` is already a dependency.

**Secrets:** `.env*` is gitignored except `.env.example`. Service-role key is server-only.

---

## 12. Tech stack & dependencies

- **Framework:** Next.js `^16.1.1` (App Router, Turbopack), React 19, TypeScript 5.
- **UI:** Tailwind v4, shadcn/ui (Radix), lucide-react, recharts, framer-motion, sonner, @tanstack/react-query & table.
- **AI/RAG:** `@huggingface/transformers` (local embeddings), `tesseract.js` (OCR), `unpdf` (PDF text), `@supabase/supabase-js`. Gemini & Groq via `fetch` (no SDK).
- **Validation/state:** `zod`, `zustand`, `react-hook-form`.
- **Tooling:** Bun (pkg manager + runner), ESLint 9, Prisma (scaffolded, unused).

---

## 13. Directory map

```
src/
  app/
    page.tsx, layout.tsx, globals.css
    api/**                REST endpoints
  components/
    modules/*             12 module UIs
    shell/*               sidebar, topbar, footer, customer-picker, stack-status
    ui/*                  shadcn primitives
  hooks/*                 use-customers, use-mobile, use-toast
  lib/
    data.ts, scoring.ts, modules.ts, utils.ts, api-utils.ts, rate-limit.ts, db.ts
    rag.ts, retrieval.ts, ingest.ts, embeddings.ts, vectors.ts     (RAG)
    llm.ts, gemini.ts, groq.ts                                     (providers)
    doc-extract.ts, kyc-validate.ts                                (Document Intelligence)
  instrumentation.ts      startup warm-up + config guard
  proxy.ts                rate limiting / gate / headers
supabase/{schema,reset}.sql
scripts/{seed-corpus,postbuild,start}.mjs
docs/{HANDOFF,PROJECT_BIBLE,EXPLAINER_VIDEO}.md
```

---

## 14. Design system

IDBI brand, light theme. Primary teal `#00674D`, accent orange `#FF7A00`, mint `#E6F7F0`, off-white `#F5F5F5`, dark-teal text `#0F2A22`. Tokens in `globals.css`; gradient teal→orange brand marks; glassmorphism cards. Charts use teal-tinted grids and readable ticks. No IDBI logo asset is used.

---

## 15. Deployment architecture

```
Browser ──► Vercel (Next.js SSR + API routes, serverless)
                 │
                 ├─► Groq API        (text generation)
                 ├─► Gemini API      (embeddings + vision)
                 └─► Supabase        (Postgres + pgvector: rag_chunks, match_chunks)
```

Stateless functions → all durable state is in Supabase. Env-configured; no server to manage.

---

## 16. Decision log

- **Next.js/TypeScript, not FastAPI.** Single Vercel deployment, no separate Python service. Since embeddings are hosted (Gemini), there's no local ML process to justify FastAPI.
- **Supabase pgvector, not FAISS.** FAISS is an in-process index that doesn't persist across serverless invocations; pgvector is persistent, queryable, and managed.
- **Provider split (Groq text / Gemini vision+embeddings).** Groq has the best free-tier text models but no vision and no embeddings; Gemini fills those. Unified behind `llm.ts` with fallback.
- **`gemini-flash-lite-latest` for Gemini text/vision.** `gemini-2.0-flash`/`2.5-flash` are billing-only (`limit: 0`) on the free tier; flash-lite has free quota.
- **`openai/gpt-oss-120b` for Groq text.** `llama-3.3-70b-versatile` is on Groq's deprecation list; gpt-oss-120b is the current production flagship (verified live via `/v1/models`).
- **`gemini-embedding-001` @768.** `text-embedding-004` 404s on current keys; embedding truncated to 768 to match the pgvector column and normalized client-side.
- **Deterministic engines stay deterministic.** Only chat, RAG, and doc-reading use LLMs; scores must be explainable and reproducible.
- **Honest stack label.** Replaced hardcoded "RAG: FAISS · DB: SQLite" with a live `/api/status`-driven label — credibility with technical reviewers.

---

## 17. Roadmap

**Near term:** deploy to Vercel; live-test Gemini vision on real scans; add auth + per-user authorization; observability (LLM latency/cost, monthly cap).
**Medium:** replace synthetic data with a real source; expand the policy corpus via upload; stronger models on billing tiers; caching of embeddings for uploaded docs.
**Longer:** agent orchestration for multi-step tool use; multi-tenant RM books; audit trail & PII vault for document processing; evaluation harness for RAG answer quality.

---

## 18. Glossary

- **RM** — Relationship Manager (the primary user).
- **RAG** — Retrieval-Augmented Generation: retrieve relevant passages, then generate a grounded answer.
- **RRF** — Reciprocal Rank Fusion: order-based fusion of multiple rankers.
- **pgvector** — Postgres extension for vector similarity search.
- **SMA / NPA** — Special Mention Account / Non-Performing Asset (RBI risk staging).
- **FOIR** — Fixed Obligation to Income Ratio. **CIBIL** — Indian credit score.
- **Verhoeff** — checksum algorithm used to validate Aadhaar numbers.
- **DPDP** — India's Digital Personal Data Protection Act, 2023.

---

*Maintained alongside the code. When architecture changes, update §6–§9 and the Decision Log.*
