"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MODULES } from "@/lib/modules";
import {
  Sparkles, ArrowRight, LogIn, LayoutDashboard, ShieldCheck, Lock, EyeOff,
  ScrollText, Landmark, Database, Cpu, Braces, Workflow, CheckCircle2,
} from "lucide-react";

const SECURITY = [
  { icon: Lock, title: "Authentication & RBAC", body: "Credentials login with RM, manager, compliance & admin roles. Every route is session-gated." },
  { icon: ShieldCheck, title: "Per-RM data isolation", body: "Relationship Managers see only their own book. Cross-book access returns 404 — no object enumeration." },
  { icon: EyeOff, title: "PII masking & redaction", body: "Aadhaar, PAN, account, phone & email are masked everywhere and scrubbed from OCR text (UIDAI/DPDP-aware)." },
  { icon: ScrollText, title: "Append-only audit trail", body: "Access, uploads, LLM queries & auth events are logged for RBI/DPDP-style accountability." },
  { icon: Database, title: "Row-Level Security", body: "Supabase RLS + server-side service role only. Strict CSP, HSTS & security headers on every response." },
  { icon: Workflow, title: "Abuse-resistant AI", body: "Per-user rate limiting, prompt-injection defenses, and citation validation keep the assistant honest." },
];

const STACK = [
  { icon: Cpu, title: "Next.js 16 + Auth.js", body: "Edge middleware, JWT sessions, and route-level authorization enforced in every handler." },
  { icon: Braces, title: "Hybrid RAG", body: "Gemini embeddings + Supabase pgvector, fused with keyword search (RRF) for grounded, cited answers." },
  { icon: Sparkles, title: "Provider-agnostic LLMs", body: "Groq & Gemini for chat, RAG synthesis and document vision — with safe fallbacks." },
  { icon: Landmark, title: "Deterministic decisioning", body: "Explainable, reviewable scoring for health, risk & eligibility — no black-box credit calls." },
];

const STATS = [
  { value: "13", label: "Integrated modules" },
  { value: "100%", label: "Routes authenticated" },
  { value: "Per-RM", label: "Data isolation" },
  { value: "Audit", label: "Logged access" },
];

export default function Landing() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const primaryHref = authed ? "/app" : "/login";
  const primaryLabel = authed ? "Go to Dashboard" : "Sign in";
  const PrimaryIcon = authed ? LayoutDashboard : LogIn;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="IDBI SARTHI" width={34} height={34} className="h-9 w-9 rounded-xl ring-1 ring-black/5" />
            <div className="leading-tight">
              <div className="text-sm font-bold gradient-text">IDBI SARTHI</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">AI RM Copilot</div>
            </div>
          </div>
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <PrimaryIcon className="h-3.5 w-3.5" /> {primaryLabel}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid-bg">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--idbi-mint) 70%, transparent), transparent 70%)" }}
        />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI Relationship Manager Copilot · IDBI Bank
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            The intelligent copilot for
            <br className="hidden md:block" />{" "}
            <span className="gradient-text">IDBI Relationship Managers</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            SARTHI — Smart AI Relationship &amp; Trust Hub Intelligence. Customer 360, financial health,
            risk prediction, explainable decisions and a policy-grounded assistant, unified in one
            secure, audit-logged workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition"
            >
              <PrimaryIcon className="h-4 w-4" /> {authed ? "Go to Dashboard" : "Launch the Copilot"}
            </Link>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-6 py-3 text-sm font-semibold hover:bg-accent/10 transition"
            >
              Explore capabilities <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-xl px-4 py-3">
                <div className="text-xl md:text-2xl font-extrabold text-primary">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead
          kicker="Capabilities"
          title="Thirteen modules, one workspace"
          sub="Everything an RM needs to understand, decide, and act — from 360° customer intelligence to a policy-aware assistant."
        />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.key} className="group glass rounded-2xl p-5 hover:border-primary/40 transition">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary group-hover:bg-primary/20 transition">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.group}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[var(--idbi-mint)]/40" />
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHead
            kicker="Security & compliance"
            title="Built to banking-grade security"
            sub="Hardened against the OWASP Top 10 and reviewed for RBI / DPDP / UIDAI expectations — because RM tooling handles the most sensitive data a bank holds."
          />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SECURITY.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="glass-strong rounded-2xl p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="text-sm font-semibold">{s.title}</div>
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHead kicker="Under the hood" title="A modern, provider-agnostic stack" sub="Real AI plumbing — not mocks — with deterministic guardrails on every credit-sensitive decision." />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {STACK.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="glass rounded-2xl p-5">
                <Icon className="h-5 w-5 text-[var(--idbi-orange)]" />
                <div className="mt-3 text-sm font-semibold">{s.title}</div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--idbi-orange)]/30 blur-3xl" />
          <h2 className="text-2xl md:text-3xl font-extrabold">Ready to see SARTHI in action?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85">
            Sign in with a demo Relationship Manager account and explore the full copilot.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition">
              <PrimaryIcon className="h-4 w-4" /> {authed ? "Go to Dashboard" : "Sign in to the demo"}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <CheckCircle2 className="h-3.5 w-3.5" /> Synthetic data · no real customer information
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={18} height={18} className="h-4 w-4 rounded" />
            <span className="font-semibold text-foreground">IDBI SARTHI</span>
            <span>· AI Relationship Manager Copilot</span>
          </div>
          <span>Prototype for the IDBI hackathon. All data is synthetic — no real IDBI customer data is used.</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--idbi-orange)]">{kicker}</div>
      <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{sub}</p>
    </div>
  );
}
