"use client";

import { MODULES, type ModuleKey } from "@/lib/modules";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
};

export function Topbar({ active, onSelect }: Props) {
  const activeMod = MODULES.find(m => m.key === active)!;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = q.length > 0
    ? MODULES.filter(m => m.label.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Mobile menu */}
      <button
        className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent/50"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle search"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Active module title */}
      <div className="flex items-center gap-2 min-w-0">
        <activeMod.icon className="h-4 w-4 text-primary shrink-0" />
        <h1 className="text-sm font-semibold truncate">{activeMod.label}</h1>
        <span className="hidden md:inline text-xs text-muted-foreground truncate">— {activeMod.desc}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
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
                onClick={() => { onSelect(m.key); setQ(""); }}
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

      {/* Notifications + AI status */}
      <button className="relative p-2 rounded-lg hover:bg-accent/50" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      </button>

      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold text-primary">AI ONLINE</span>
      </div>
    </header>
  );
}

// Mobile bottom navigation
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
