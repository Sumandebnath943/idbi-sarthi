"use client";

import { Sparkles, Github, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-medium text-foreground/80">IDBI SARTHI</span>
          <span className="text-muted-foreground/60">·</span>
          <span>Smart AI Relationship & Trust Hub Intelligence</span>
          <span className="text-muted-foreground/60 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Synthetic data — no real PII</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-600" />
            <span>DPDP Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Github className="h-3 w-3" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
