"use client";

import { useEffect, useState } from "react";

export type CustomerLite = {
  id: string;
  name: string;
  age: number;
  segment: string;
  city: string;
  monthlyIncome: number;
  rmId: string;
  kycStatus: string;
  npaFlag: boolean;
  digitalEngagement: number;
};

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/customers?limit=100");
        if (!r.ok) { if (!cancelled) { setCustomers([]); setLoading(false); } return; }
        const d = await r.json();
        if (!cancelled) { setCustomers(d.customers ?? []); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { customers, loading };
}
