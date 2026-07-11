"use client";

import { useEffect, useState } from "react";

// Fetches the live stack from /api/status and renders an honest one-line label.
// Falls back to a neutral label if the request fails.
export function StackStatus() {
  const [label, setLabel] = useState("LLM: — · Retrieval: Hybrid · Store: In-Memory");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/status");
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled && d?.labels?.short) {
          setLabel(d.labels.short);
          setOnline(d.llm !== "none");
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
      <span>{label}</span>
    </div>
  );
}
