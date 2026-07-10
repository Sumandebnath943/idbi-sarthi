"use client";

import { useEffect, useState } from "react";
import { Banknote, Sparkles, CheckCircle2, XCircle, IndianRupee } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, BandBadge, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Rec = {
  product: { id: string; name: string; type: string; minAmount: number; maxAmount: number; minTenureMonths: number; maxTenureMonths: number; baseRate: number; highlights: string[] };
  matchScore: number;
  estimatedRate: number;
  estimatedEMI: number;
  reasons: string[];
  eligible: boolean;
};

export function LoanRecommendation() {
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState(2500000);
  const [tenure, setTenure] = useState(180);
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);

  function recommend() {
    if (!customerId) return;
    setLoading(true);
    fetch("/api/loans/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, amount, tenureMonths: tenure }),
    })
      .then(async r => { if (!r.ok) throw new Error("bad response"); return r.json(); })
      .then(d => { setRecs(d.recommendations ?? []); setLoading(false); })
      .catch(() => { setRecs([]); setLoading(false); });
  }

  return (
    <div>
      <ModuleHeader
        title="Loan Recommendation"
        desc="Multi-product matcher with rate estimation & EMI calculation"
        icon={Banknote}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <CustomerPicker value={customerId} onChange={setCustomerId} />
        </div>
        <GlassCard className="p-4">
          <Label className="text-xs">Loan Amount: INR {(amount/100000).toFixed(2)}L</Label>
          <Slider value={[amount]} onValueChange={v => setAmount(v[0])} min={50000} max={20000000} step={50000} className="mt-2" />
          <div className="text-[10px] text-muted-foreground mt-1">Range: INR 50K - 2 Cr</div>
        </GlassCard>
        <GlassCard className="p-4">
          <Label className="text-xs">Tenure: {tenure} months ({(tenure/12).toFixed(1)} yrs)</Label>
          <Slider value={[tenure]} onValueChange={v => setTenure(v[0])} min={12} max={360} step={6} className="mt-2" />
          <div className="text-[10px] text-muted-foreground mt-1">Range: 1 - 30 years</div>
        </GlassCard>
      </div>

      <Button onClick={recommend} disabled={!customerId || loading} className="mb-6">
        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Matching..." : "Get Recommendations"}
      </Button>

      {!customerId && <EmptyState icon={Banknote} message="Select a customer and configure loan parameters" />}

      {customerId && loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}

      {recs && recs.length === 0 && (
        <EmptyState icon={XCircle} message="No matching products for the given amount and tenure" />
      )}

      {recs && recs.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{recs.length}</span> product(s) ranked by match score
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recs.map((r, i) => (
              <GlassCard key={r.product.id} className={cn("p-5", i === 0 && "glow-accent border-primary/40")}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{r.product.name}</h3>
                      {i === 0 && <Badge className="text-[9px] bg-primary/20 text-primary border-primary/40">TOP MATCH</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.product.type} · {r.product.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{r.matchScore}</div>
                    <div className="text-[10px] text-muted-foreground">match score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <div className="text-[10px] text-muted-foreground uppercase">Est. Rate</div>
                    <div className="text-sm font-semibold">{r.estimatedRate.toFixed(2)}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <div className="text-[10px] text-muted-foreground uppercase">Monthly EMI</div>
                    <div className="text-sm font-semibold">INR {(r.estimatedEMI/1000).toFixed(1)}K</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30">
                    <div className="text-[10px] text-muted-foreground uppercase">Status</div>
                    {r.eligible
                      ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Eligible</span>
                      : <span className="text-xs font-semibold text-amber-600 flex items-center gap-1"><XCircle className="h-3 w-3" />Conditional</span>}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Highlights</div>
                  <div className="flex flex-wrap gap-1">
                    {r.product.highlights.map(h => <Badge key={h} variant="outline" className="text-[9px]">{h}</Badge>)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Why this match</div>
                  <ul className="space-y-1">
                    {r.reasons.map((rs, j) => (
                      <li key={j} className="text-[11px] flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">▸</span> {rs}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
  