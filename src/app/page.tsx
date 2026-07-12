"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, type Variants } from "framer-motion";
import { MODULES } from "@/lib/modules";
import {
  Sparkles, ArrowRight, LogIn, LayoutDashboard, ShieldCheck, Lock, EyeOff,
  ScrollText, Landmark, Database, Cpu, Braces, Workflow, CheckCircle2,
  TrendingUp, Activity, BadgeCheck, Bot,
} from "lucide-react";

/* ---------------- data ---------------- */

const SECURITY = [
  { icon: Lock, title: "Authentication & RBAC", body: "Credentials login with RM, manager, compliance & admin roles. Every route is session-gated." },
  { icon: ShieldCheck, title: "Per-RM data isolation", body: "RMs see only their own book. Out-of-book access returns 404 — zero object enumeration." },
  { icon: EyeOff, title: "PII masking & redaction", body: "Aadhaar, PAN, account, phone & email masked everywhere and scrubbed from OCR (UIDAI/DPDP-aware)." },
  { icon: ScrollText, title: "Append-only audit trail", body: "Access, uploads, LLM queries & auth events logged for RBI/DPDP-grade accountability." },
  { icon: Database, title: "Row-Level Security", body: "Supabase RLS, server-side secrets, strict CSP, HSTS & security headers on every response." },
  { icon: Workflow, title: "Abuse-resistant AI", body: "Per-user rate limiting, prompt-injection defenses & citation validation keep answers honest." },
];

const STACK = [
  { icon: Cpu, title: "Next.js 16 + Auth.js", body: "Edge middleware, JWT sessions and route-level authorization enforced in every handler." },
  { icon: Braces, title: "Hybrid RAG", body: "Gemini embeddings + Supabase pgvector fused with keyword search (RRF) for grounded, cited answers." },
  { icon: Sparkles, title: "Provider-agnostic LLMs", body: "Groq & Gemini power chat, RAG synthesis and document vision — with safe fallbacks." },
  { icon: Landmark, title: "Deterministic decisioning", body: "Explainable, reviewable scoring for health, risk & eligibility — no black-box credit calls." },
];

const STATS = [
  { value: "13", label: "Integrated modules" },
  { value: "100%", label: "Routes authenticated" },
  { value: "Per-RM", label: "Data isolation" },
  { value: "0", label: "PII in cleartext" },
];

/* ---------------- motion ---------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------------- page ---------------- */

export default function Landing() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const primaryHref = authed ? "/app" : "/login";
  const PrimaryIcon = authed ? LayoutDashboard : LogIn;
  const primaryLabel = authed ? "Go to Dashboard" : "Sign in";

  return (
    <div className="min-h-screen bg-[#03130E] text-white overflow-x-hidden">
      {/* ============ NAV ============ */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-3 max-w-6xl px-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="IDBI SARTHI" width={32} height={32} className="h-8 w-8 rounded-lg ring-1 ring-white/10" />
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-tight">IDBI SARTHI</div>
                <div className="text-[8.5px] uppercase tracking-[0.2em] text-emerald-300/70">AI RM Copilot</div>
              </div>
            </div>
            <nav className="hidden items-center gap-7 text-[13px] text-white/70 md:flex">
              <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
              <a href="#security" className="hover:text-white transition">Security</a>
              <a href="#stack" className="hover:text-white transition">Technology</a>
            </nav>
            <Link href={primaryHref} className="group inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#004D38] transition hover:bg-emerald-50">
              <PrimaryIcon className="h-3.5 w-3.5" /> {primaryLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        {/* layered background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_-10%,#0b6b4f_0%,#053d2c_45%,#03130e_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.15] [background-image:linear-gradient(#ffffff22_1px,transparent_1px),linear-gradient(90deg,#ffffff22_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_0%,#000_30%,transparent_75%)]" />
        <div className="absolute -top-24 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute right-[8%] top-40 -z-10 h-72 w-72 rounded-full bg-[#FF7A00]/25 blur-[110px]" />

        <div className="mx-auto max-w-6xl px-5 pt-36 pb-16 text-center md:pt-44">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-emerald-100 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" /></span>
            AI Relationship Manager Copilot · IDBI Bank
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl"
          >
            Banking intelligence,
            <br />
            <span className="bg-gradient-to-r from-emerald-200 via-white to-[#FFB566] bg-clip-text text-transparent">reimagined for every RM.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-base"
          >
            SARTHI unifies Customer 360, financial health, risk prediction, explainable decisions and a
            policy-grounded assistant into one secure, audit-logged workspace — so Relationship Managers
            act faster, and with confidence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href={primaryHref} className="group inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,122,0,0.7)] transition hover:bg-[#ff8c1f]">
              <PrimaryIcon className="h-4 w-4" /> {authed ? "Open the Copilot" : "Launch the Copilot"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#capabilities" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Explore capabilities
            </a>
          </motion.div>

          {/* product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            <div className="absolute -inset-x-10 -top-8 bottom-0 -z-10 rounded-[2rem] bg-emerald-400/10 blur-2xl" />
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i} className="px-6 py-8 text-center">
              <div className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{s.value}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-white/45">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ CAPABILITIES ============ */}
      <section id="capabilities" className="relative bg-[#03130E] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><SectionHead kicker="Capabilities" title="Thirteen modules. One command center." sub="Everything a Relationship Manager needs to understand a customer, decide, and act — from 360° intelligence to a policy-aware assistant." /></Reveal>
          <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.key} delay={i % 3}>
                  <div className="group h-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 transition hover:border-emerald-400/30 hover:from-emerald-400/[0.08]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/20 transition group-hover:bg-emerald-400/20">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{m.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/40">{m.group}</div>
                      </div>
                    </div>
                    <p className="mt-3.5 text-[13px] leading-relaxed text-white/55">{m.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SECURITY ============ */}
      <section id="security" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_80%_at_80%_0%,#0a3d2c,transparent_60%)]" />
        <div className="absolute left-[10%] top-10 -z-10 h-64 w-64 rounded-full bg-[#FF7A00]/15 blur-[120px]" />
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFB566]"><ShieldCheck className="h-3.5 w-3.5" /> Security &amp; compliance</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Built to banking-grade security</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/60">Hardened against the OWASP Top 10 and reviewed for RBI / DPDP / UIDAI expectations — because RM tooling handles the most sensitive data a bank holds.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i % 3}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7A00]/15 text-[#FFB566] ring-1 ring-inset ring-[#FF7A00]/25"><Icon className="h-5 w-5" /></span>
                    <div className="mt-3.5 text-sm font-semibold text-white">{s.title}</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ STACK ============ */}
      <section id="stack" className="bg-[#03130E] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><SectionHead kicker="Under the hood" title="A modern, provider-agnostic stack" sub="Real AI plumbing — not mocks — with deterministic guardrails on every credit-sensitive decision." /></Reveal>
          <div className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                    <Icon className="h-6 w-6 text-emerald-300" />
                    <div className="mt-4 text-sm font-semibold text-white">{s.title}</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="px-5 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(120deg,#0b6b4f,#053d2c)] px-6 py-16 text-center">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#FF7A00]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">See SARTHI in action</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/75">Sign in with a demo Relationship Manager account and explore the full copilot end-to-end.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#004D38] transition hover:bg-emerald-50">
                <PrimaryIcon className="h-4 w-4" /> {authed ? "Go to Dashboard" : "Sign in to the demo"}
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/70"><CheckCircle2 className="h-3.5 w-3.5" /> Synthetic data · no real customer information</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-7 text-[11px] text-white/40 sm:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={18} height={18} className="h-4 w-4 rounded" />
            <span className="font-semibold text-white/80">IDBI SARTHI</span>
            <span>· AI Relationship Manager Copilot</span>
          </div>
          <span>Prototype for the IDBI hackathon. All data is synthetic — no real IDBI customer data is used.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- sub-components ---------------- */

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFB566]">{kicker}</div>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">{title}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-white/60">{sub}</p>
    </div>
  );
}

/** A stylized preview of the copilot dashboard used as the hero visual. */
function HeroMockup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071b14]/80 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl ring-1 ring-white/5">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-[10px] text-white/50">
          <LayoutDashboard className="h-3 w-3" /> Customer 360 · CUST-1042
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-400/15 px-2 py-1 text-[9px] font-semibold text-emerald-300"><Bot className="h-2.5 w-2.5" /> AI ONLINE</span>
      </div>

      <div className="grid grid-cols-[44px_1fr] gap-2 rounded-xl bg-[#04140e] p-2.5 text-left md:grid-cols-[52px_1fr]">
        {/* mini sidebar */}
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white/[0.03] py-3">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-400 to-[#FF7A00]" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-5 w-5 rounded-md ${i === 0 ? "bg-emerald-400/30" : "bg-white/[0.06]"}`} />
          ))}
        </div>

        {/* main */}
        <div className="space-y-2.5">
          {/* customer header */}
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/40 to-emerald-500/10 text-xs font-bold text-emerald-200">AR</div>
            <div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white">Ananya Rao
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-medium text-white/70">Wealth</span>
                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-medium text-emerald-300"><BadgeCheck className="h-2.5 w-2.5" />KYC</span>
              </div>
              <div className="text-[9px] text-white/40">Priority · Mumbai · RM-201</div>
            </div>
          </div>

          {/* stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            <Tile label="Health Score" value="782" tone="emerald" icon={Activity} />
            <Tile label="Default Risk" value="Low" tone="emerald" icon={ShieldCheck} />
            <Tile label="Total AUM" value="₹4.2 Cr" tone="orange" icon={TrendingUp} />
          </div>

          {/* chart */}
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-white/40">Portfolio trend · 6M</span>
              <span className="text-[9px] font-semibold text-emerald-300">+18.4%</span>
            </div>
            <svg viewBox="0 0 320 70" className="h-16 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,55 C40,50 55,38 90,40 C130,42 150,20 195,24 C235,28 260,12 320,8 L320,70 L0,70 Z" fill="url(#area)" />
              <path d="M0,55 C40,50 55,38 90,40 C130,42 150,20 195,24 C235,28 260,12 320,8" fill="none" stroke="#6ee7b7" strokeWidth="2" />
            </svg>
          </div>

          {/* NBA chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FF7A00]/15 px-2 py-1 text-[9px] font-medium text-[#FFB566]"><Sparkles className="h-2.5 w-2.5" /> Pitch: Wealth SIP top-up</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-1 text-[9px] font-medium text-emerald-300">Eligible: Home Loan @ 8.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone, icon: Icon }: { label: string; value: string; tone: "emerald" | "orange"; icon: React.ComponentType<{ className?: string }> }) {
  const toneCls = tone === "emerald" ? "text-emerald-300" : "text-[#FFB566]";
  return (
    <div className="rounded-lg bg-white/[0.03] p-2.5">
      <Icon className={`h-3.5 w-3.5 ${toneCls}`} />
      <div className="mt-1.5 text-sm font-bold text-white">{value}</div>
      <div className="text-[8.5px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}
