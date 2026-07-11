# IDBI SARTHI — Engineering Handoff

> **Audience:** the engineer(s) taking ownership of this codebase.
> **Goal:** get you from zero to running, deploying, and confidently changing the app.
> **Companion docs:** [`PROJECT_BIBLE.md`](./PROJECT_BIBLE.md) (deep reference), [`EXPLAINER_VIDEO.md`](./EXPLAINER_VIDEO.md) (demo/marketing).

---

## 1. What this is

**IDBI SARTHI** ("Smart AI Relationship & Trust Hub Intelligence") is an **AI Relationship Manager Copilot** for IDBI Bank — a single-page web app with **12 modules** spanning customer analytics, decisioning, an AI assistant, and operations. It was built to a hackathon blueprint and then hardened into a real product: the RAG Knowledge Base and Document Intelligence modules run on real embeddings, a real vector database, and real LLMs.

- **Repo:** https://github.com/Sumandebnath943/idbi-sarthi (branch: `main`)
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Bun
- **AI:** Groq (`openai/gpt-oss-120b`) for text · Google Gemini for embeddings + document vision · Supabase (Postgres + pgvector) for the vector store
- **Deploy target:** Vercel + Supabase

---

## 2. Current status (as of 2026-07-11)

| Area | Status |
|---|---|
| 12 functional modules | ✅ built & working |
| RAG Knowledge Base | ✅ real hybrid vector RAG (Gemini embeddings + Supabase pgvector + Groq generation), verified live |
| Document Intelligence | ✅ upload + Gemini-vision OCR + KYC validation + Customer-360 cross-check, verified live |
| Provider layer (Groq/Gemini) | ✅ unified with fallback |
| Supabase persistence | ✅ schema applied + seeded (9 chunks) |
| Lint | ✅ clean |
| Pushed to `main` | ✅ |
| Deployed to Vercel | ⏳ pending your deploy (see §7) |
| Auth / per-user authorization | ❌ deferred (synthetic data; see §9) |
| Gemini vision on a real uploaded image | ⚠️ configured, not yet tested with an actual scan |

---

## 3. Prerequisites

- **Bun** (package manager + runner). On the original Windows dev machine it lives at `C:\Users\Admin\.bun\bin\bun.exe` and is **not on PATH** — prefix commands with:
  ```powershell
  $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
  ```
  Install fresh with: `irm bun.sh/install.ps1 | iex` (Windows) or `curl -fsSL https://bun.sh/install | bash`.
- **Node** 20+ is also present (used by `scripts/*.mjs`).
- Accounts/keys (all have free tiers): **Groq**, **Google AI Studio (Gemini)**, **Supabase**.

---

## 4. Local setup (first run)

```bash
# 1. Install dependencies (bun reads bun.lock)
bun install
# If native postinstalls are blocked (onnxruntime-node powers the local-embedding fallback):
bun pm trust onnxruntime-node protobufjs tesseract.js

# 2. Create .env.local (see §5 for the full list). Minimum to run with full AI:
#    GROQ_API_KEY, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 3. Apply the Supabase schema (once): open supabase/reset.sql in an editor,
#    copy ALL, paste into Supabase SQL Editor, Run. (Copy from the FILE, not chat —
#    avoids non-breaking-space corruption.)

# 4. Seed the vector store (once per Supabase project):
bun run scripts/seed-corpus.mjs

# 5. Run
bun run dev            # http://localhost:3000
```

> **Zero-config mode:** with **no** keys, the app still runs. It uses local embeddings (transformers.js MiniLM) + an in-memory vector store + keyword-only RAG answers. Good for offline UI work; not what you deploy.

### Useful scripts
| Command | Does |
|---|---|
| `bun run dev` | Dev server on :3000 (Turbopack) |
| `bun run build` | Production build (+ `scripts/postbuild.mjs`) |
| `bun run start` | Start built app (`scripts/start.mjs`) |
| `bun run lint` | ESLint |
| `bun run scripts/seed-corpus.mjs` | Embed + insert the 8 policies into the vector store |

---

## 5. Environment variables

Full reference is in [`.env.example`](../.env.example). The important ones:

| Var | Required? | Purpose | Default |
|---|---|---|---|
| `GROQ_API_KEY` | for text AI | Primary text LLM (chat, RAG answers, doc text-extraction) | — |
| `GEMINI_API_KEY` | **yes** | Embeddings **and** document vision (no Groq equivalent) | — |
| `SUPABASE_URL` | for prod | pgvector project URL | — |
| `SUPABASE_SERVICE_ROLE_KEY` | for prod | Server-side writes/reads (bypasses RLS) | — |
| `GROQ_MODEL` | no | Text model | `openai/gpt-oss-120b` |
| `GEMINI_MODEL` | no | Gemini text/vision model | `gemini-flash-lite-latest` |
| `GEMINI_EMBED_MODEL` | no | Embedding model | `gemini-embedding-001` (@768) |
| `LLM_PROVIDER` | no | Force text order: `groq`\|`gemini` | `groq` |
| `EMBEDDINGS_PROVIDER` | no | Force `gemini`\|`local` | auto (gemini if key) |
| `VECTOR_STORE` | no | Force `supabase`\|`memory` | auto (supabase if creds) |
| `API_GATE_TOKEN` | no | If set, all `/api/*` require this token | disabled |
| `RATE_LIMIT_GENERAL` / `RATE_LIMIT_CHAT` | no | Per-IP/min caps | 100 / 12 |

⚠️ **Never commit `.env.local`.** It is gitignored (`.env*` with a `!.env.example` exception). The service-role key is powerful — treat it like a password.

---

## 6. How the AI stack fits together

Three roles, deliberately split across providers (see the Decision Log in the Bible for *why*):

```
Text  (chat, RAG answers, doc text-extraction) → Groq  openai/gpt-oss-120b   (→ Gemini fallback)
Vision(document image OCR/extraction)          → Gemini gemini-flash-lite-latest (→ Tesseract fallback)
Embeddings                                     → Gemini gemini-embedding-001 @768 (→ local MiniLM 384 fallback)
Vectors                                        → Supabase pgvector (→ in-memory fallback)
```

- **`src/lib/llm.ts`** — unified `llmComplete()`; picks provider by order, auto-routes vision to Gemini.
- **`src/lib/gemini.ts`**, **`src/lib/groq.ts`** — thin REST clients.
- **`src/lib/embeddings.ts`** — provider-driven embeddings.
- **`src/lib/vectors.ts`** — `VectorStore` interface + `InMemoryVectorStore` + `SupabaseVectorStore`.

The **status endpoint** `GET /api/status` reports which providers are actually active; the sidebar/topbar label reads it live.

---

## 7. Deploying to Vercel

1. Import the GitHub repo into Vercel (framework auto-detected as Next.js).
2. Add env vars in **Vercel → Settings → Environment Variables**: `GROQ_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (optionally `GEMINI_MODEL`, `GROQ_MODEL`, `LLM_PROVIDER`).
3. Ensure the Supabase project already has the schema (`supabase/reset.sql`) and is seeded (§4). It's shared across environments, so **no seeding step is needed on Vercel** — RAG works on first request.
4. Deploy.

> **Why Supabase and not in-memory in prod:** Vercel functions are stateless/ephemeral — an in-memory vector store would not persist across invocations. Supabase pgvector is the source of truth.

---

## 8. Runbook (common tasks)

- **Add a policy to the knowledge base:** RAG module → "Add policy (PDF/TXT)", or `POST /api/rag/ingest` (multipart `file`). It chunks, embeds, and upserts. Idempotent by chunk id.
- **Re-seed / reset the corpus:** re-run `supabase/reset.sql` (drops & recreates), then `bun run scripts/seed-corpus.mjs`.
- **Switch text model** (e.g., after enabling Google/Groq billing): set `GROQ_MODEL` or `GEMINI_MODEL`. Check live availability with `GET https://api.groq.com/openai/v1/models` (Groq) or `GET https://generativelanguage.googleapis.com/v1beta/models?key=...` (Gemini).
- **Change embedding dimension:** the Supabase column is `vector(768)` to match Gemini. If you switch to local embeddings (384) or a different model, change **both** the SQL column and `match_chunks` signature, set `GEMINI_EMBED_DIM`, and re-seed.
- **Force keyword-only RAG** (no LLM cost): unset both LLM keys, or the answer path degrades gracefully.

---

## 9. Known issues & gotchas

1. **Bun not on PATH** on the dev box — prefix with the `$env:Path` line (§3).
2. **Gemini free-tier limits:** `gemini-2.0-flash` / `gemini-2.5-flash` return HTTP 429 `limit: 0` (billing-only). Default is **`gemini-flash-lite-latest`** which has free quota. Embeddings (`gemini-embedding-001`) are a separate, working quota. Bump the model once billing is enabled.
3. **Groq deprecations:** `llama-3.3-70b-versatile` and `llama-4-scout` (old vision) are being retired. Text default is **`openai/gpt-oss-120b`** (confirmed live). Groq has **no production vision model** and **no embeddings endpoint** — that's why vision + embeddings live on Gemini.
4. **Supabase schema cache:** right after DDL, PostgREST may throw `PGRST205/202` ("could not find table/function") for ~30–60s. Fix: run `notify pgrst, 'reload schema';` (included at the end of `reset.sql`).
5. **Column named `content`, not `text`:** the vector table uses `content` (a bareword `text` column plus flattened SQL comments caused syntax errors). Keep it.
6. **`next.config.ts` sets `typescript.ignoreBuilderrors: true`** — the build won't fail on type errors. Run `bunx tsc --noEmit` yourself. (Pre-existing type errors exist in `examples/` and two recharts tooltip formatters — unrelated to core logic.)
7. **Model downloads:** the local-embeddings fallback pulls ~90 MB (transformers.js) and Tesseract ~15 MB on first use. Not hit in prod when Gemini is configured.
8. **`.env` has a stale `DATABASE_URL`** (Prisma is scaffolded but unused at runtime) — harmless.

---

## 10. Verifying a change works

- **RAG:** `POST /api/rag/search {"query":"..."}` → expect `grounded:true`, an `answer` with `[POL-xxx]` citations, and `sources[]`.
- **Chat:** `POST /api/chat {"message":"..."}` → `provider` + `reply`.
- **Docs:** `POST /api/documents` (multipart `file` or JSON `text`) → `type`, `entities`, `validations`, `crossCheck`.
- **Stack:** `GET /api/status` → active `llm` / `embeddings` / `vector`.
- Lint: `bun run lint`. Types: `bunx tsc --noEmit`.

---

## 11. Where things live (quick map)

```
src/app/api/**        REST endpoints (thin; call src/lib)
src/lib/data.ts       synthetic dataset + types + getCustomer()
src/lib/scoring.ts    all deterministic engines (health, risk, loan, lead, NBA, schemes, explain)
src/lib/{rag,retrieval,ingest,embeddings,vectors}.ts   RAG pipeline
src/lib/{llm,gemini,groq}.ts                            LLM providers
src/lib/{doc-extract,kyc-validate}.ts                   Document Intelligence
src/components/modules/*   the 12 module UIs
src/components/shell/*      sidebar, topbar, footer, pickers, StackStatus
src/proxy.ts          edge proxy: rate limiting, optional token gate, security headers
supabase/*.sql        pgvector schema + reset
scripts/*.mjs         seed, build, start
```

---

## 12. Backlog / next steps

- **Auth & per-user authorization** (RM → own book). Currently every `/api/*` is open (synthetic data). `next-auth` is already a dependency; add a real gate before real customer data.
- **Replace synthetic data** with a real customer source; wire Prisma or extend Supabase.
- **Gemini vision live test** on a real Aadhaar/PAN scan.
- **Stronger models** once billing is enabled (Gemini 2.5 / larger Groq).
- **Agent orchestration** if multi-step tool use is wanted (today it's a retrieve→generate pipeline).
- Observability: log LLM latency/cost; add a monthly cap.

---

*Handoff prepared 2026-07-11. Keep this doc and the Bible updated as the system evolves.*
