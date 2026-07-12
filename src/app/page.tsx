"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles, ArrowRight, LogIn, LayoutDashboard, ShieldCheck, Lock, EyeOff,
  ScrollText, Database, Workflow, CheckCircle2, TrendingUp, Activity, BadgeCheck,
  Bot, HeartPulse, ShieldAlert, Brain, BookOpen, FileText, Quote, UserRound,
  Users, Settings2, Fingerprint, Send, MessageCircleQuestion,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/* ---------------- data ---------------- */

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "Security", href: "#security" },
  { label: "Blog", href: "#blog" },
  { label: "FAQ", href: "#faq" },
];

const TRUST = ["RBI-aligned", "DPDP Act 2023", "UIDAI masking", "OWASP Top 10", "ISO 27001-aware"];

const STEPS = [
  { n: "1", icon: Fingerprint, title: "Sign in securely", body: "Role-based access with RM, manager, compliance & admin roles. Each RM lands in their own book — nothing more." },
  { n: "2", icon: LayoutDashboard, title: "Open any customer", body: "A 360° profile — accounts, transactions, health, risk and KYC — assembled and scored in one view, instantly." },
  { n: "3", icon: Sparkles, title: "Decide with AI", body: "Grounded, cited answers, next-best-actions and explainable scores. Advise and act with confidence." },
];

const FEATURES = [
  { icon: LayoutDashboard, title: "Customer 360", body: "Unified profile with accounts, transactions and live risk signals." },
  { icon: HeartPulse, title: "Financial Health Score", body: "A weighted 0–900 score with a transparent 6-factor breakdown." },
  { icon: ShieldAlert, title: "Risk Prediction", body: "12-month default probability with SMA staging and drivers." },
  { icon: Brain, title: "Explainable AI", body: "SHAP-style attribution so every recommendation can be justified." },
  { icon: BookOpen, title: "RAG Knowledge Base", body: "Hybrid retrieval over bank policy with grounded, cited answers." },
  { icon: FileText, title: "Document Intelligence", body: "OCR, KYC validation and Customer-360 cross-checks in seconds." },
];

const SECURITY = [
  { icon: Lock, title: "Authentication & RBAC", body: "Every route is session-gated, with roles for RM, manager, compliance & admin." },
  { icon: ShieldCheck, title: "Per-RM data isolation", body: "RMs see only their own book — out-of-book access returns 404, zero enumeration." },
  { icon: EyeOff, title: "PII masking & redaction", body: "Aadhaar, PAN, account, phone & email masked and scrubbed from OCR (UIDAI/DPDP-aware)." },
  { icon: ScrollText, title: "Append-only audit trail", body: "Access, uploads, LLM queries & auth events logged for RBI/DPDP-grade accountability." },
  { icon: Database, title: "Row-Level Security", body: "Supabase RLS, server-side secrets, strict CSP, HSTS & security headers everywhere." },
  { icon: Workflow, title: "Abuse-resistant AI", body: "Per-user rate limiting, prompt-injection defenses and citation validation." },
];

const ROLES = [
  {
    icon: UserRound, name: "Relationship Manager", tag: "Front line",
    highlight: false,
    perks: ["Own customer book only", "Customer 360 · health · risk", "AI assistant & next-best-actions", "Document KYC verification"],
  },
  {
    icon: Users, name: "Branch Manager", tag: "Oversight",
    highlight: true,
    perks: ["Full portfolio visibility", "Cross-RM analytics & leads", "All RM capabilities", "Team performance signals"],
  },
  {
    icon: Settings2, name: "Administrator", tag: "Control",
    highlight: false,
    perks: ["Knowledge-base ingestion", "Corpus & policy management", "Full portfolio access", "Audit-log oversight"],
  },
];

const POSTS = [
  { tag: "Explainability", title: "How explainable AI builds trust in lending decisions", body: "Why SHAP-style attribution turns a score into a story an RM — and a customer — can actually believe." },
  { tag: "Scoring", title: "The six factors behind a financial health score", body: "A look under the hood of a transparent 0–900 model, and how each factor moves the needle." },
  { tag: "RAG", title: "RAG done right: grounded answers over bank policy", body: "Hybrid retrieval, citation validation and prompt-injection defenses that keep answers honest." },
];

const FAQS = [
  { q: "Does SARTHI use real customer data?", a: "No. The entire dataset is synthetic and generated in-memory. The security controls are production-grade so it is ready for real data, but no real IDBI customer information is used in this prototype." },
  { q: "How is customer data protected?", a: "Authentication with role-based access, per-RM data isolation (out-of-book lookups return 404), PII masking for Aadhaar/PAN/account/phone/email, Supabase Row-Level Security, an append-only audit trail, and strict CSP/HSTS with per-user rate limiting." },
  { q: "Can the AI make lending or risk decisions on its own?", a: "No. Language models are advisory only. Eligibility, risk and health scoring run on deterministic, explainable engines with human review — there are no black-box credit decisions." },
  { q: "Which AI models power it?", a: "Groq and Gemini drive chat, RAG synthesis and document vision, with Gemini embeddings + Supabase pgvector for retrieval. The stack is provider-agnostic with safe fallbacks." },
  { q: "Is it ready to deploy?", a: "Yes — it runs on Vercel and is hardened with authentication, RLS, CSP/HSTS and rate limiting. Before real use, connect a governed data source in place of the synthetic dataset." },
];

const PERSONAS = [
  { initials: "AM", tint: "from-indigo-400/50 to-indigo-500/10" },
  { initials: "RS", tint: "from-violet-400/50 to-violet-500/10" },
  { initials: "SR", tint: "from-sky-400/50 to-sky-500/10" },
  { initials: "VS", tint: "from-fuchsia-400/50 to-fuchsia-500/10" },
];

/* ---------------- motion ---------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
};
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-70px" }} className={className}>
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
  const primaryLabel = authed ? "Dashboard" : "Sign in";

  return (
    <div className="min-h-screen bg-[#060609] text-white antialiased selection:bg-indigo-500/30">
      {/* ============ NAV ============ */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-9">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="IDBI SARTHI" width={34} height={34} className="h-9 w-9" />
              <span className="hidden text-[15px] font-semibold tracking-tight sm:block">SARTHI</span>
            </Link>
            <nav className="hidden items-center gap-7 text-[14px] font-medium text-white/65 md:flex">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="transition hover:text-white">{n.label}</a>
              ))}
            </nav>
          </div>
          <Link href={primaryHref} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.03] px-6 py-2.5 text-[13px] font-medium text-white backdrop-blur transition hover:bg-white/[0.08]">
            <PrimaryIcon className="h-3.5 w-3.5" /> {primaryLabel}
          </Link>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#04060e]" />
        <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(#ffffff16_1px,transparent_1px),linear-gradient(90deg,#ffffff16_1px,transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(#000_82%,transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(72%_56%_at_45%_-10%,rgba(60,120,255,0.60)_0%,rgba(38,82,208,0.32)_26%,rgba(12,30,95,0.18)_48%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_46%_-8%,rgba(100,155,255,0.55)_0%,rgba(62,112,240,0.22)_42%,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(17%_13%_at_47%_-3%,rgba(222,234,255,0.88)_0%,rgba(150,190,255,0.28)_46%,transparent_76%)]" />

        <div className="mx-auto max-w-6xl px-5 pt-32 pb-14 text-center md:pt-40">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-[12.5px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
            AI-Driven Banking Clarity
          </motion.span>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-5xl text-[36px] font-normal leading-[1.06] tracking-[-0.02em] md:text-[64px] md:leading-[1.04] lg:whitespace-nowrap">
            Banking that moves smarter with you
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/55 md:text-[16px]">
            Manage, understand and grow every customer relationship with ease. Whether you advise, cross-sell
            or safeguard — SARTHI is built to empower every kind of Relationship Manager.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-6">
            <Link href={primaryHref} className="group inline-flex items-center gap-3 rounded-full bg-[#4f5bd5] py-2 pl-6 pr-2 text-[15px] font-medium text-white shadow-[0_16px_44px_-14px_rgba(79,91,213,0.95)] transition hover:brightness-110">
              {authed ? "Open the Copilot" : "Launch the Copilot"}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#4f5bd5] transition group-hover:scale-105"><ArrowRight className="h-4 w-4" /></span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {PERSONAS.slice(0, 3).map((p) => (
                  <span key={p.initials} className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${p.tint} text-[11px] font-bold text-white ring-2 ring-[#020205]`}>{p.initials}</span>
                ))}
              </div>
              <div className="text-left leading-tight">
                <div className="text-[13px] font-semibold text-white">5 demo RMs</div>
                <div className="text-[12px] text-white/55">Sign in to explore</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ---- logo strip ---- */}
        <div className="mx-auto max-w-5xl px-5 pb-24 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {TRUST.map((t) => (
              <span key={t} className="text-[17px] font-semibold uppercase tracking-tight text-white/30 transition hover:text-white/55">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INTRO + 3 CARDS ============ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-semibold tracking-tight md:text-[40px]">Transform how RMs serve customers — smart, seamless, AI-powered.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">SARTHI turns scattered banking data into clear, confident action — so every conversation starts with context and ends with a decision.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <Reveal delay={0}><CardChart /></Reveal>
          <Reveal delay={1}><AssistantMockup /></Reveal>
          <Reveal delay={2}><CardScore /></Reveal>
        </div>
      </section>

      {/* ============ 3 STEPS (giant numbers) ============ */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <Reveal><SectionHead kicker="How it works" title="Your workflow, simplified in 3 steps" sub="No training required. SARTHI meets RMs where they work and hands them intelligence, not homework." /></Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-indigo-500/[0.08] to-white/[0.01] p-7">
                  <span className="pointer-events-none absolute -right-1 -top-8 select-none text-[130px] font-black leading-none text-white/[0.05]">{s.n}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/25"><Icon className="h-5 w-5" /></span>
                  <div className="mt-5 text-base font-semibold">{s.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal><SectionHead kicker="Capabilities" title="Powering the modern Relationship Manager" sub="Thirteen integrated modules — here are six that RMs reach for every day." /></Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i % 3}>
                <div className="group h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition hover:border-indigo-400/30 hover:bg-indigo-500/[0.06]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-300 ring-1 ring-inset ring-indigo-400/20 transition group-hover:bg-indigo-500/20"><Icon className="h-5 w-5" /></span>
                  <div className="mt-4 text-[15px] font-semibold">{f.title}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ DASHBOARD SHOWCASE ============ */}
      <section className="relative isolate overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_50%,#1c1c47,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><SectionHead kicker="One workspace" title="Everything you need, in one dashboard" sub="Profile, health, risk and next-best-actions — clarity and control at a glance." /></Reveal>
          <Reveal delay={1}>
            <div className="relative mx-auto mt-12 max-w-4xl">
              <div className="absolute -inset-x-8 -bottom-6 top-6 -z-10 rounded-[2.5rem] bg-indigo-500/15 blur-2xl" />
              <DashboardMockup />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ ROLES (pricing-style) ============ */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal><SectionHead kicker="Access model" title="The right view for every role" sub="Access is scoped by responsibility — powerful for the front line, complete for oversight." /></Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <Reveal key={r.name} delay={i}>
                <div className={`relative h-full rounded-3xl border p-7 ${r.highlight ? "border-indigo-400/40 bg-gradient-to-b from-indigo-500/[0.16] to-white/[0.02] shadow-[0_20px_60px_-25px_rgba(99,102,241,0.6)]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                  {r.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most access</span>}
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-indigo-300"><Icon className="h-5 w-5" /></span>
                  <div className="mt-4 text-lg font-bold">{r.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/40">{r.tag}</div>
                  <ul className="mt-5 space-y-2.5">
                    {r.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[13px] text-white/70"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />{p}</li>
                    ))}
                  </ul>
                  <Link href={primaryHref} className={`mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition ${r.highlight ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:brightness-110" : "border border-white/15 text-white hover:bg-white/5"}`}>
                    <PrimaryIcon className="h-3.5 w-3.5" /> {authed ? "Open dashboard" : "Sign in as demo"}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ TESTIMONIAL / PHILOSOPHY ============ */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <Reveal>
          <Quote className="mx-auto h-8 w-8 text-indigo-400/60" />
          <p className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-snug tracking-tight md:text-[28px]">
            “We built SARTHI so an RM can walk into any conversation already knowing the customer — and back
            every recommendation with a reason, not a guess.”
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {PERSONAS.map((p) => (
                <span key={p.initials} className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${p.tint} text-[11px] font-bold text-white ring-2 ring-[#060609]`}>{p.initials}</span>
              ))}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">IDBI SARTHI · Hackathon Team</div>
              <div className="text-[11px] text-white/45">Designed with Relationship Managers in mind</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ SECURITY ============ */}
      <section id="security" className="relative isolate overflow-hidden py-24">
        <div className="pointer-events-none absolute left-[12%] top-8 -z-10 h-64 w-64 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300"><ShieldCheck className="h-3.5 w-3.5" /> Security &amp; compliance</div>
              <h2 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[40px]">Built to banking-grade security</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">Hardened against the OWASP Top 10 and reviewed for RBI / DPDP / UIDAI expectations — because RM tooling handles the most sensitive data a bank holds.</p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i % 3}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/25"><Icon className="h-5 w-5" /></span>
                    <div className="mt-4 text-sm font-semibold">{s.title}</div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ BLOG ============ */}
      <section id="blog" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">From the team</div>
              <h2 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[40px]">Explore fresh ideas.<br />Discover the future of banking AI.</h2>
            </div>
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/5">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {POSTS.map((p, i) => (
            <Reveal key={p.title} delay={i}>
              <div className="group h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition hover:border-indigo-400/30">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-sky-500/20">
                  <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(#ffffff40_1px,transparent_1px),linear-gradient(90deg,#ffffff40_1px,transparent_1px)] [background-size:22px_22px]" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">{p.tag}</span>
                </div>
                <div className="p-6">
                  <div className="text-[15px] font-semibold leading-snug">{p.title}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">{p.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 transition group-hover:gap-2.5">Read more <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ FAQ (heading + chat-style card) ============ */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">FAQ</div>
              <h2 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[40px]">Have questions about the platform?</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">Everything about data, decisions and readiness — before you trust a tool with your customers.</p>
              <Link href={primaryHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-xs font-semibold text-white transition hover:brightness-110">
                <MessageCircleQuestion className="h-4 w-4" /> Try the demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-indigo-500/[0.08] to-white/[0.01] p-4 md:p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-white/[0.07] pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white"><Bot className="h-4 w-4" /></span>
                <div>
                  <div className="text-[13px] font-semibold">SARTHI Assistant</div>
                  <div className="text-[10px] text-white/45">Ask anything · usually answers instantly</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-1 text-[9px] font-semibold text-indigo-300"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Online</span>
              </div>
              <Accordion type="single" collapsible className="space-y-2.5">
                {FAQS.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4">
                    <AccordionTrigger className="py-3.5 text-left text-sm font-semibold text-white hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-white/55">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
                <input readOnly placeholder="Ask a question…" className="w-full bg-transparent text-[13px] text-white/60 placeholder:text-white/35 focus:outline-none" />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white"><Send className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="px-5 pb-20">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-indigo-400/20 bg-[linear-gradient(120deg,#312e81,#4c1d95)] px-6 py-16 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
            <h2 className="text-[28px] font-semibold tracking-tight md:text-[40px]">See SARTHI in action</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/80">Sign in with a demo Relationship Manager account and explore the full copilot end-to-end.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#312e81] transition hover:bg-indigo-50">
                <PrimaryIcon className="h-4 w-4" /> {authed ? "Go to Dashboard" : "Sign in to the demo"}
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/75"><CheckCircle2 className="h-3.5 w-3.5" /> Synthetic data · no real customer information</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 pt-14">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.svg" alt="" width={28} height={28} className="h-7 w-7 rounded-lg ring-1 ring-white/10" />
                <span className="text-sm font-bold">IDBI SARTHI</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/45">Banking that moves smarter with you. An AI Relationship Manager copilot — built to empower every kind of RM.</p>
            </div>
            <div className="flex gap-14">
              <FooterCol title="Product" links={[["How it works", "#how"], ["Features", "#features"], ["Roles", "#roles"]]} />
              <FooterCol title="Trust" links={[["Security", "#security"], ["Blog", "#blog"], ["FAQ", "#faq"], ["Sign in", primaryHref]]} />
            </div>
          </div>
          <div className="mt-10 select-none bg-gradient-to-b from-white/[0.08] to-transparent bg-clip-text text-center text-[16vw] font-black leading-none tracking-tighter text-transparent md:text-[190px]">
            #SARTHI
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] py-6 text-[11px] text-white/40 sm:flex-row">
            <span>© {new Date().getFullYear()} IDBI SARTHI · AI Relationship Manager Copilot</span>
            <span>Hackathon prototype · all data is synthetic — no real IDBI customer data is used.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- sub-components ---------------- */

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">{kicker}</div>
      <h2 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[40px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-white/55">{sub}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}><a href={href} className="text-[13px] text-white/60 transition hover:text-white">{label}</a></li>
        ))}
      </ul>
    </div>
  );
}

/* ---- intro cards ---- */

function CardChart() {
  return (
    <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold"><Activity className="h-4 w-4 text-indigo-300" /> Smarter health scoring</div>
      <p className="mt-1.5 text-xs text-white/50">See a customer’s financial trajectory at a glance.</p>
      <svg viewBox="0 0 300 110" className="mt-4 h-28 w-full">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" /><stop offset="100%" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="300" y1={20 + i * 24} y2={20 + i * 24} stroke="#ffffff10" />)}
        <path d="M0,88 C40,80 55,60 90,62 C130,64 150,34 195,40 C235,45 260,20 300,14 L300,110 L0,110 Z" fill="url(#cg)" />
        <path d="M0,88 C40,80 55,60 90,62 C130,64 150,34 195,40 C235,45 260,20 300,14" fill="none" stroke="#a5b4fc" strokeWidth="2.5" />
        <path d="M0,96 C50,94 70,88 110,86 C150,84 180,76 220,74 C255,72 275,66 300,64" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
      </svg>
    </div>
  );
}

function CardScore() {
  const pct = 782 / 900;
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#c084fc" /></linearGradient></defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ffffff12" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-extrabold">782</div>
          <div className="text-[9px] uppercase tracking-wider text-white/45">/ 900</div>
        </div>
      </div>
      <div className="mt-4 text-[13px] font-semibold">Financial Health Score</div>
      <p className="mt-1 text-xs text-white/50">Weighted, explainable, 6-factor.</p>
    </div>
  );
}

/* ---- dashboard preview (dark) ---- */

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b18]/90 p-2 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.9)] ring-1 ring-white/5 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-[10px] text-white/50"><LayoutDashboard className="h-3 w-3" /> Customer 360 · CUST-1042</div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-1 text-[9px] font-semibold text-indigo-300"><Bot className="h-2.5 w-2.5" /> AI ONLINE</span>
      </div>
      <div className="grid grid-cols-[44px_1fr] gap-2.5 rounded-xl bg-[#080814] p-2.5 text-left md:grid-cols-[52px_1fr]">
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white/[0.03] py-3">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-400 to-violet-500" />
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`h-5 w-5 rounded-md ${i === 0 ? "bg-indigo-400/30" : "bg-white/[0.06]"}`} />)}
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400/40 to-violet-500/10 text-xs font-bold text-indigo-200">AR</div>
            <div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold">Ananya Rao
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-medium text-white/70">Wealth</span>
                <span className="inline-flex items-center gap-0.5 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[8px] font-medium text-indigo-300"><BadgeCheck className="h-2.5 w-2.5" />KYC</span>
              </div>
              <div className="text-[9px] text-white/40">Priority · Mumbai · RM-201</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DTile label="Health Score" value="782" tone="text-indigo-300" icon={Activity} />
            <DTile label="Default Risk" value="Low" tone="text-emerald-300" icon={ShieldCheck} />
            <DTile label="Total AUM" value="₹4.2 Cr" tone="text-violet-300" icon={TrendingUp} />
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="mb-1.5 flex items-center justify-between"><span className="text-[9px] uppercase tracking-wider text-white/40">Portfolio trend · 6M</span><span className="text-[9px] font-semibold text-indigo-300">+18.4%</span></div>
            <svg viewBox="0 0 320 64" className="h-16 w-full" preserveAspectRatio="none">
              <defs><linearGradient id="areaD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" /><stop offset="100%" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
              <path d="M0,50 C40,46 55,34 90,36 C130,38 150,18 195,22 C235,26 260,10 320,7 L320,64 L0,64 Z" fill="url(#areaD)" />
              <path d="M0,50 C40,46 55,34 90,36 C130,38 150,18 195,22 C235,26 260,10 320,7" fill="none" stroke="#a5b4fc" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-1 text-[9px] font-medium text-violet-300"><Sparkles className="h-2.5 w-2.5" /> Pitch: Wealth SIP top-up</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/12 px-2 py-1 text-[9px] font-medium text-indigo-300">Eligible: Home Loan @ 8.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DTile({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg bg-white/[0.03] p-2.5">
      <Icon className={`h-3.5 w-3.5 ${tone}`} />
      <div className="mt-1.5 text-sm font-bold">{value}</div>
      <div className="text-[8.5px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

/* ---- assistant preview (dark) ---- */

function AssistantMockup() {
  return (
    <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 border-b border-white/[0.07] pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/12 text-indigo-300"><BookOpen className="h-4 w-4" /></span>
        <span className="text-xs font-semibold">Personal Finance Assistant</span>
        <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white/50">Hybrid retrieval</span>
      </div>
      <div className="mt-3 space-y-2.5 text-left">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-[11px] text-white">What CIBIL score is needed for a home loan?</div>
        <div className="rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-wider text-indigo-300"><Quote className="h-2.5 w-2.5" /> Grounded answer</div>
          <p className="text-[11px] leading-relaxed text-white/70">A minimum CIBIL score of <span className="font-semibold text-white">750</span> is required, with income eligibility and a FOIR under 50% <span className="rounded bg-indigo-500/15 px-1 font-mono text-[9px] text-indigo-300">POL-001</span>.</p>
          <div className="mt-2 flex items-center gap-1.5 border-t border-white/[0.07] pt-2"><FileText className="h-3 w-3 text-white/40" /><span className="text-[9px] text-white/40">POL-001 · Home Loan Eligibility</span></div>
        </div>
      </div>
    </div>
  );
}
