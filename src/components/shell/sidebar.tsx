"use client";

import { MODULES, MODULE_GROUPS, type ModuleKey } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronRight } from "lucide-react";
import { StackStatus } from "@/components/shell/stack-status";

type Props = {
  active: ModuleKey;
  onSelect: (k: ModuleKey) => void;
};

export function Sidebar({ active, onSelect }: Props) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/40 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/60">
        <div className="relative h-9 w-9 rounded-xl flex items-center justify-center glow-accent"
             style={{ background: "linear-gradient(135deg, var(--idbi-teal) 0%, var(--idbi-saffron) 100%)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide gradient-text">IDBI SARTHI</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">AI RM Copilot · v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {MODULE_GROUPS.map(group => (
          <div key={group}>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-semibold">{group}</div>
            <div className="space-y-1">
              {MODULES.filter(m => m.group === group).map(m => {
                const Icon = m.icon;
                const isActive = m.key === active;
                return (
                  <button
                    key={m.key}
                    onClick={() => onSelect(m.key)}
                    className={cn(
                      "group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all",
                      isActive
                        ? "bg-primary/15 text-foreground glow-accent"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium leading-tight truncate">{m.short}</div>
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="border-t border-border/60 px-4 py-3">
        <StackStatus />
      </div>
    </aside>
  );
}
