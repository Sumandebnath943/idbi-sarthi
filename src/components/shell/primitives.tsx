"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ReactNode } from "react";

export function ModuleHeader({ title, desc, icon: Icon }: { title: string; desc: string; icon: LucideIcon }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center glow-accent shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function StatCard({
  label, value, change, icon: Icon, tone = "default"
}: {
  label: string;
  value: ReactNode;
  change?: { value: string; positive: boolean };
  icon?: LucideIcon;
  tone?: "default" | "primary" | "warning" | "danger" | "success";
}) {
  const toneClasses = {
    default: "border-border/60",
    primary: "border-primary/40 bg-primary/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    danger: "border-red-500/30 bg-red-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
  };
  return (
    <Card className={cn("p-4 glass", toneClasses[tone])}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {change && (
        <div className={cn("flex items-center gap-1 text-[11px] mt-1.5", change.positive ? "text-emerald-400" : "text-red-400")}>
          {change.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{change.value}</span>
        </div>
      )}
    </Card>
  );
}

export function GlassCard({ children, className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("glass", className)} {...props}>{children}</Card>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold tracking-wide text-foreground/90">{children}</h3>
      {action}
    </div>
  );
}

export function BandBadge({ band }: { band: string }) {
  const map: Record<string, string> = {
    Excellent: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Good: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    Fair: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Poor: "bg-red-500/15 text-red-300 border-red-500/30",
    Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Moderate: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    High: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Critical: "bg-red-500/15 text-red-300 border-red-500/30",
    Approve: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Decline: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  const cls = map[band] ?? "bg-muted text-muted-foreground border-border";
  return <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border", cls)}>{band}</span>;
}

export function PriorityBadge({ p }: { p: "P0" | "P1" | "P2" | "P3" }) {
  const map: Record<string, string> = {
    P0: "bg-red-500/20 text-red-300 border-red-500/40",
    P1: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    P2: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    P3: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", map[p])}>{p}</span>;
}

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
