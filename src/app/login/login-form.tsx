"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("Sarthi@2026!");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="glass-strong rounded-2xl p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="IDBI SARTHI" width={48} height={48} className="h-12 w-12 rounded-xl ring-1 ring-black/5" />
          <h1 className="mt-3 text-lg font-bold gradient-text">IDBI SARTHI</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">AI RM Copilot · Secure Sign In</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@idbi.demo"
              className="mt-1 w-full h-10 rounded-lg bg-card/60 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full h-10 rounded-lg bg-card/60 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
            />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Demo accounts (synthetic data · password <code className="font-mono">Sarthi@2026!</code>)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ["anjali@idbi.demo", "RM · RM-201"],
              ["sneha@idbi.demo", "RM · RM-203"],
              ["manager@idbi.demo", "Manager"],
              ["admin@idbi.demo", "Admin"],
            ].map(([mail, label]) => (
              <button
                key={mail}
                type="button"
                onClick={() => fillDemo(mail)}
                className="text-left rounded-md border border-border/50 px-2 py-1.5 hover:bg-accent/40"
              >
                <div className="text-[10px] font-medium truncate">{mail}</div>
                <div className="text-[9px] text-muted-foreground">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-muted-foreground/70">
        All customer data in this prototype is synthetic. No real IDBI data is used.
      </p>
    </div>
  );
}
