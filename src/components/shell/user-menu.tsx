"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, ShieldCheck } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  rm: "Relationship Manager",
  manager: "Branch Manager",
  compliance: "Compliance",
  admin: "Administrator",
};

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const user = session?.user;
  if (!user) return null;

  const role = (user.role as string) ?? "rm";
  const initials = (user.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2 py-1.5 hover:bg-accent/50"
        aria-label="Account menu"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          {initials}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-[11px] font-semibold">{user.name}</span>
          <span className="text-[9px] text-muted-foreground">{ROLE_LABEL[role] ?? role}</span>
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 glass-strong rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60">
            <div className="text-xs font-semibold">{user.name}</div>
            <div className="text-[11px] text-muted-foreground">{user.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary">
              <ShieldCheck className="h-3 w-3" />
              {ROLE_LABEL[role] ?? role}
              {user.rmId ? ` · ${user.rmId}` : ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-accent/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
