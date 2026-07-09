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
        <div className={cn("flex items-center gap-1 text-[11px] mt-1.5 font-medium", change.positive ? "text-emerald-600" : "text-red-600")}>
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
    Excellent: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Good: "bg-teal-100 text-teal-700 border-teal-300",
    Fair: "bg-amber-100 text-amber-700 border-amber-300",
    Poor: "bg-red-100 text-red-700 border-red-300",
    Low: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Moderate: "bg-teal-100 text-teal-700 border-teal-300",
    High: "bg-amber-100 text-amber-700 border-amber-300",
    Critical: "bg-red-100 text-red-700 border-red-300",
    Approve: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Review: "bg-amber-100 text-amber-700 border-amber-300",
    Decline: "bg-red-100 text-red-700 border-red-300",
  };
  const cls = map[band] ?? "bg-muted text-muted-foreground border-border";
  return <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border", cls)}>{band}</span>;
}

export function PriorityBadge({ p }: { p: "P0" | "P1" | "P2" | "P3" }) {
  const map: Record<string, string> = {
    P0: "bg-red-100 text-red-700 border-red-300",
    P1: "bg-orange-100 text-orange-700 border-orange-300",
    P2: "bg-teal-100 text-teal-700 border-teal-300",
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
