"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles, ArrowRight, LogIn, LayoutDashboard, ShieldCheck, Lock, EyeOff,
  ScrollText, Database, Workflow, CheckCircle2,
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
  { q: "Does IDBI SARTHI use real customer data?", a: "No. The entire dataset is synthetic and generated in-memory. The security controls are production-grade so it is ready for real data, but no real IDBI customer information is used in this prototype." },
  { q: "How is customer data protected?", a: "Authentication with role-based access, per-RM data isolation (out-of-book lookups return 404), PII masking for Aadhaar/PAN/account/phone/email, Supabase Row-Level Security, an append-only audit trail, and strict CSP/HSTS with per-user rate limiting." },
  { q: "Can the AI make lending or risk decisions on its own?", a: "No. Language models are advisory only. Eligibility, risk and health scoring run on deterministic, explainable engines with human review — there are no black-box credit decisions." },
  { q: "Which AI models power it?", a: "Groq and Gemini drive chat, RAG synthesis and document vision, with Gemini embeddings + Supabase pgvector for retrieval. The stack is provider-agnostic with safe fallbacks." },
  { q: "Is it ready to deploy?", a: "Yes — it runs on Vercel and is hardened with authentication, RLS, CSP/HSTS and rate limiting. Before real use, connect a governed data source in place of the synthetic dataset." },
];

const PERSONAS = [
  { initials: "AM", tint: "from-emerald-400/50 to-emerald-500/10" },
  { initials: "RS", tint: "from-teal-400/50 to-teal-500/10" },
  { initials: "SR", tint: "from-orange-400/50 to-orange-500/10" },
  { initials: "VS", tint: "from-emerald-300/50 to-emerald-400/10" },
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
    <div className="min-h-screen bg-[#060609] text-white antialiased selection:bg-emerald-500/30">
      {/* ============ NAV ============ */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-9">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="IDBI SARTHI" width={36} height={36} className="h-9 w-9 rounded-[9px]" />
              <span className="hidden text-[15px] font-semibold tracking-tight sm:block">IDBI SARTHI</span>
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#050d0a]" />
        <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(#ffffff16_1px,transparent_1px),linear-gradient(90deg,#ffffff16_1px,transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(#000_82%,transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(100%_70%_at_47%_-18%,rgba(0,140,104,0.36)_0%,rgba(0,88,66,0.22)_32%,rgba(3,40,30,0.10)_56%,transparent_76%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_44%_at_47%_-12%,rgba(178,246,222,0.46)_0%,rgba(56,200,154,0.18)_48%,transparent_76%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(32%_23%_at_48%_-6%,rgba(244,255,251,0.88)_0%,rgba(196,248,230,0.36)_46%,rgba(130,228,196,0.10)_70%,transparent_86%)]" />

        <div className="mx-auto max-w-6xl px-5 pt-24 pb-14 text-center md:pt-28">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 text-[12.5px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
            The AI copilot for Relationship Managers
          </motion.span>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-5xl text-[36px] font-normal leading-[1.06] tracking-[-0.02em] md:text-[64px] md:leading-[1.04] lg:whitespace-nowrap">
            Banking that moves smarter with you
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/55 md:text-[16px]">
            Manage, understand and grow every customer relationship with ease. Whether you advise, cross-sell
            or safeguard — IDBI SARTHI is built to empower every kind of Relationship Manager.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-6">
            <Link href={primaryHref} className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#00A37A] to-[#006B50] py-2 pl-6 pr-2 text-[15px] font-medium text-white shadow-[0_16px_44px_-14px_rgba(0,103,77,0.9)] transition hover:brightness-110">
              {authed ? "Open the Copilot" : "Launch the Copilot"}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#00674D] transition group-hover:scale-105"><ArrowRight className="h-4 w-4" /></span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {PERSONAS.slice(0, 3).map((p) => (
                  <span key={p.initials} className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${p.tint} text-[11px] font-bold text-white ring-2 ring-[#050d0a]`}>{p.initials}</span>
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
            <h2 className="text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">Transform how RMs serve customers — smart, seamless, AI-powered.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">IDBI SARTHI turns scattered banking data into clear, confident action — so every conversation starts with context and ends with a decision.</p>
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
        <Reveal><SectionHead kicker="How it works" title="Your workflow, simplified in 3 steps" sub="No training required. IDBI SARTHI meets RMs where they work and hands them intelligence, not homework." /></Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i}>
                <div className="relative flex h-[320px] flex-col justify-end overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0a1a15] via-[#0b3a2b] to-[#03996f] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                  <span className="pointer-events-none absolute -right-2 top-0 select-none bg-gradient-to-b from-white/55 via-white/25 to-white/[0.05] bg-clip-text text-[200px] font-black leading-none tracking-tighter text-transparent">{s.n}</span>
                  <Icon className="absolute left-7 top-7 h-7 w-7 text-white/90" strokeWidth={1.5} />
                  <div className="relative">
                    <div className="text-lg font-semibold tracking-tight">{s.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{s.body}</p>
                  </div>
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
                <div className="group h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20 transition group-hover:bg-emerald-500/20"><Icon className="h-5 w-5" /></span>
                  <div className="mt-4 text-[15px] font-semibold">{f.title}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ DASHBOARD SHOWCASE ============ */}
      <section className="px-5 py-24">
        <Reveal className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_50px_140px_-40px_rgba(0,103,77,0.5)]">
            <div className="mx-auto max-w-3xl px-6 pt-14 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00674D]">One workspace</div>
              <h2 className="mt-3 text-[26px] font-normal leading-tight tracking-[-0.02em] text-[#0f2a22] md:text-[38px]">Everything you need, all in one dashboard — clarity, control and insight at a glance.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5a6b65]">Profile, health, risk and next-best-actions in a single, unified view — so every RM opens a customer already knowing exactly where to focus.</p>
            </div>
            <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dashboard-preview.png" alt="IDBI SARTHI Customer 360 Dashboard" className="w-full rounded-t-xl border-x border-t border-black/10 shadow-[0_-4px_60px_rgba(0,0,0,0.12)]" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ ROLES (pricing-style) ============ */}
      <section id="roles" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal><SectionHead kicker="Access model" title="The right view for every role" sub="Access is scoped by responsibility — powerful for the front line, complete for oversight." /></Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <Reveal key={r.name} delay={i}>
                <div className={`relative h-full rounded-3xl border p-7 ${r.highlight ? "border-emerald-400/40 bg-gradient-to-b from-emerald-500/[0.16] to-white/[0.02] shadow-[0_20px_60px_-25px_rgba(0,103,77,0.6)]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                  {r.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Most access</span>}
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300"><Icon className="h-5 w-5" /></span>
                  <div className="mt-4 text-lg font-bold">{r.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/40">{r.tag}</div>
                  <ul className="mt-5 space-y-2.5">
                    {r.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[13px] text-white/70"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{p}</li>
                    ))}
                  </ul>
                  <Link href={primaryHref} className={`mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition ${r.highlight ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110" : "border border-white/15 text-white hover:bg-white/5"}`}>
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
          <Quote className="mx-auto h-8 w-8 text-emerald-400/60" />
          <p className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-snug tracking-tight md:text-[28px]">
            “We built IDBI SARTHI so an RM can walk into any conversation already knowing the customer — and back
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
        <div className="pointer-events-none absolute left-[12%] top-8 -z-10 h-64 w-64 rounded-full bg-orange-500/15 blur-[120px]" />
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300"><ShieldCheck className="h-3.5 w-3.5" /> Security &amp; compliance</div>
              <h2 className="mt-3 text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">Built to banking-grade security</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">Hardened against the OWASP Top 10 and reviewed for RBI / DPDP / UIDAI expectations — because RM tooling handles the most sensitive data a bank holds.</p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i % 3}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-400/25"><Icon className="h-5 w-5" /></span>
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
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">From the team</div>
              <h2 className="mt-3 text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">Explore fresh ideas.<br />Discover the future of banking AI.</h2>
            </div>
            <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/5">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {POSTS.map((p, i) => (
            <Reveal key={p.title} delay={i}>
              <div className="group h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition hover:border-emerald-400/30">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-orange-500/15">
                  <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(#ffffff40_1px,transparent_1px),linear-gradient(90deg,#ffffff40_1px,transparent_1px)] [background-size:22px_22px]" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">{p.tag}</span>
                </div>
                <div className="p-6">
                  <div className="text-[15px] font-semibold leading-snug">{p.title}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/55">{p.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 transition group-hover:gap-2.5">Read more <ArrowRight className="h-3.5 w-3.5" /></span>
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
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">FAQ</div>
              <h2 className="mt-3 text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">Have questions about the platform?</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">Everything about data, decisions and readiness — before you trust a tool with your customers.</p>
              <Link href={primaryHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-semibold text-white transition hover:brightness-110">
                <MessageCircleQuestion className="h-4 w-4" /> Try the demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-emerald-500/[0.08] to-white/[0.01] p-4 md:p-6">
              <div className="mb-4 flex items-center gap-2 border-b border-white/[0.07] pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Bot className="h-4 w-4" /></span>
                <div>
                  <div className="text-[13px] font-semibold">IDBI SARTHI Assistant</div>
                  <div className="text-[10px] text-white/45">Ask anything · usually answers instantly</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-semibold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"><Send className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="px-5 pb-20">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-[linear-gradient(120deg,#00674D,#003D2C)] px-6 py-16 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
            <h2 className="text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">See IDBI SARTHI in action</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/80">Sign in with a demo Relationship Manager account and explore the full copilot end-to-end.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#00674D] transition hover:bg-emerald-50">
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
                <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7 rounded-[7px]" />
                <span className="text-sm font-bold">IDBI SARTHI</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/45">Banking that moves smarter with you. An AI Relationship Manager copilot — built to empower every kind of RM.</p>
            </div>
            <div className="flex gap-14">
              <FooterCol title="Product" links={[["How it works", "#how"], ["Features", "#features"], ["Roles", "#roles"]]} />
              <FooterCol title="Trust" links={[["Security", "#security"], ["Blog", "#blog"], ["FAQ", "#faq"], ["Sign in", primaryHref]]} />
            </div>
          </div>
          <div className="mt-10 select-none bg-gradient-to-b from-white/[0.08] to-transparent bg-clip-text text-center text-[12vw] font-black leading-none tracking-tighter text-transparent md:text-[140px]">
            IDBI SARTHI
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
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">{kicker}</div>
      <h2 className="mt-3 text-[28px] font-normal tracking-[-0.02em] md:text-[40px]">{title}</h2>
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
    <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
      <div className="text-[17px] font-semibold tracking-tight">Smarter spending decisions</div>
      <p className="mt-2 text-[13px] leading-relaxed text-white/55">Visualise a customer’s cashflow, spot trends and guide budgets in real time with AI.</p>
      <div className="mt-6 rounded-2xl bg-white p-4">
        <div className="text-[13px] font-bold text-[#0f2a22]">Daily cashflow</div>
        <div className="relative mt-3">
          <svg viewBox="0 0 300 120" className="h-32 w-full">
            {[0, 1, 2, 3].map((i) => <line key={i} x1={20 + i * 87} x2={20 + i * 87} y1="8" y2="98" stroke="#0f2a22" strokeOpacity="0.08" strokeDasharray="3 3" />)}
            <path d="M0,72 C40,62 60,32 95,44 C130,56 150,86 190,74 C230,62 255,28 300,38" fill="none" stroke="#00674D" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,88 C45,82 70,90 105,82 C150,72 175,98 215,90 C250,83 275,66 300,72" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="95" cy="44" r="4.5" fill="#fff" stroke="#00674D" strokeWidth="2.5" />
            <rect x="72" y="14" width="48" height="20" rx="6" fill="#0f2a22" />
            <text x="96" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">₹32k</text>
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[9px] font-medium text-black/40">
            <span>8:00</span><span>12:00</span><span>16:00</span><span>20:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardScore() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
        <Sparkles className="h-3 w-3 text-emerald-300" /> Explainable health score
      </span>
      <div className="mt-auto pt-10">
        <div className="flex items-end gap-1.5">
          <span className="text-[68px] font-normal leading-none tracking-tight">782</span>
          <span className="mb-2.5 text-xl text-white/40">/ 900</span>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-white/55">A weighted, six-factor score every RM can defend — with a transparent breakdown behind every single point.</p>
      </div>
    </div>
  );
}

/* ---- assistant preview (dark) ---- */

function AssistantMockup() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6">
      <div className="text-[17px] font-semibold tracking-tight">Your personal finance assistant</div>
      <p className="mt-2 text-[13px] leading-relaxed text-white/55">Grounded, cited answers over bank policy — whether it’s eligibility, savings or paying down debt.</p>
      <div className="mt-6 space-y-2.5 text-left">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-[11px] text-white">What CIBIL score is needed for a home loan?</div>
        <div className="rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-wider text-emerald-300"><Quote className="h-2.5 w-2.5" /> Grounded answer</div>
          <p className="text-[11px] leading-relaxed text-white/70">A minimum CIBIL score of <span className="font-semibold text-white">750</span> is required, with income eligibility and a FOIR under 50% <span className="rounded bg-emerald-500/15 px-1 font-mono text-[9px] text-emerald-300">POL-001</span>.</p>
          <div className="mt-2 flex items-center gap-1.5 border-t border-white/[0.07] pt-2"><FileText className="h-3 w-3 text-white/40" /><span className="text-[9px] text-white/40">POL-001 · Home Loan Eligibility</span></div>
        </div>
      </div>
    </div>
  );
}
