"use client";

import { MODULES, type ModuleKey } from "@/lib/modules";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Bell, Sparkles, AlertTriangle, UserPlus, TrendingUp, ShieldAlert, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
};

// Static demo notifications — surfaced when the bell is clicked
const NOTIFICATIONS = [
  { id: 1, icon: AlertTriangle, color: "text-amber-400", title: "High-risk customer detected", body: "CUST-1007 probability of default rose to 32%", time: "5 min ago" },
  { id: 2, icon: UserPlus, color: "text-cyan-400", title: "New lead assigned", body: "Ritu Bansal · Home Loan · INR 65L", time: "23 min ago" },
  { id: 3, icon: TrendingUp, color: "text-emerald-400", title: "Wealth AUM milestone", body: "RM-203 crossed INR 400 Cr book size", time: "1 hr ago" },
  { id: 4, icon: ShieldAlert, color: "text-red-400", title: "NPA flag raised", body: "CUST-1019 entered SMA-2 stage", time: "2 hr ago" },
];

export function Topbar({ active, onSelect }: Props) {
  const activeMod = MODULES.find(m => m.key === active)!;
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);   // mobile nav drawer
  const [notifOpen, setNotifOpen] = useState(false); // notifications dropdown
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Close notif dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notifOpen]);

  // Close mobile nav on escape
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setNavOpen(false); setNotifOpen(false); setSearchOpen(false); }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const results = q.length > 0
    ? MODULES.filter(m => m.label.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase()))
    : [];

  function handleSelect(k: ModuleKey) {
    onSelect(k);
    setNavOpen(false);
    setSearchOpen(false);
    setQ("");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
        {/* Mobile hamburger — opens the drawer */}
        <button
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent/50"
          onClick={() => setNavOpen(o => !o)}
          aria-label="Toggle navigation menu"
        >
          {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Active module title */}
        <div className="flex items-center gap-2 min-w-0">
          <activeMod.icon className="h-4 w-4 text-primary shrink-0" />
          <h1 className="text-sm font-semibold truncate">{activeMod.label}</h1>
          <span className="hidden md:inline text-xs text-muted-foreground truncate">— {activeMod.desc}</span>
        </div>

        <div className="flex-1" />

        {/* Search (desktop) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search modules..."
            className="h-8 w-48 rounded-lg bg-card/60 border border-border/60 pl-8 pr-3 text-xs outline-none focus:border-primary/60 focus:w-64 transition-all"
          />
          {results.length > 0 && (
            <div className="absolute right-0 top-10 w-64 glass-strong rounded-lg p-1 shadow-2xl z-50">
              {results.map(m => (
                <button
                  key={m.key}
                  onClick={() => handleSelect(m.key)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-accent/50 text-left"
                >
                  <m.icon className="h-3.5 w-3.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{m.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications — now opens a dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative p-2 rounded-lg hover:bg-accent/50"
            aria-label="Notifications"
            onClick={() => setNotifOpen(o => !o)}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--idbi-saffron)] animate-pulse" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 glass-strong rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--idbi-saffron)]/20 text-[var(--idbi-saffron)] font-medium">{NOTIFICATIONS.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map(n => {
                  const Icon = n.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => { onSelect("nba"); setNotifOpen(false); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent/40 border-b border-border/30 text-left transition-colors"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium leading-tight">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { onSelect("nba"); setNotifOpen(false); }}
                className="w-full px-4 py-2.5 text-[11px] text-primary hover:bg-accent/40 border-t border-border/60 flex items-center justify-center gap-1 font-medium"
              >
                View all in Next Best Action <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* AI status badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary">AI ONLINE</span>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
          />
          {/* drawer */}
          <div className="relative w-72 max-w-[80vw] h-full bg-sidebar/95 backdrop-blur-xl border-r border-border/60 flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-5 py-5 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center glow-accent"
                     style={{ background: "linear-gradient(135deg, var(--idbi-teal) 0%, var(--idbi-saffron) 100%)" }}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold gradient-text">IDBI SARTHI</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest">AI RM Copilot</div>
                </div>
              </div>
              <button onClick={() => setNavOpen(false)} className="p-2 rounded-lg hover:bg-accent/50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {(["Customer", "Decisioning", "Assistant", "Operations"] as const).map(group => (
                <div key={group}>
                  <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-semibold">{group}</div>
                  <div className="space-y-1">
                    {MODULES.filter(m => m.group === group).map(m => {
                      const Icon = m.icon;
                      const isActive = m.key === active;
                      return (
                        <button
                          key={m.key}
                          onClick={() => handleSelect(m.key)}
                          className={cn(
                            "group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all",
                            isActive ? "bg-primary/15 text-foreground glow-accent" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium">{m.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-border/60 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LLM: Groq · RAG: FAISS · DB: SQLite</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile bottom navigation (kept for quick switching)
export function MobileNav({ active, onSelect }: Props) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="grid grid-cols-6 gap-0.5 px-1 py-1.5 overflow-x-auto">
        {MODULES.slice(0, 12).map(m => {
          const Icon = m.icon;
          const isActive = m.key === active;
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 rounded-md min-w-[58px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[8px] font-medium">{m.short.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
