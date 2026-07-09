"use client";

import { useEffect, useState } from "react";
import { UserCheck, Zap, Plus } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, PriorityBadge, EmptyState } from "@/components/shell/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Lead = {
  id: string; name: string; source: string; product: string;
  estimatedValue: number; score: number; stage: string; assignedRm: string; lastContact: string;
};

const STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
const STAGE_COLOR: Record<string, string> = {
  New: "border-slate-500/30 bg-slate-500/5",
  Qualified: "border-cyan-500/30 bg-cyan-500/5",
  Proposal: "border-blue-500/30 bg-blue-500/5",
  Negotiation: "border-amber-500/30 bg-amber-500/5",
  Won: "border-emerald-500/30 bg-emerald-500/5",
  Lost: "border-red-500/30 bg-red-500/5",
};

export function LeadQualification() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pipeline" | "qualify">("pipeline");

  // Form state
  const [income, setIncome] = useState(60000);
  const [cibil, setCibil] = useState(760);
  const [age, setAge] = useState(34);
  const [existingCustomer, setExistingCustomer] = useState(true);
  const [interest, setInterest] = useState<"High" | "Medium" | "Low">("High");
  const [sourceValue, setSourceValue] = useState(2500000);
  const [result, setResult] = useState<{ score: number; stage: string; rationale: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/leads");
        const d = await r.json();
        if (!cancelled) { setLeads(d.leads ?? []); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function qualify() {
    setSubmitting(true);
    fetch("/api/leads/qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income, cibil, age, existingCustomer, interest, sourceValue }),
    })
      .then(r => r.json())
      .then(d => { setResult(d); setSubmitting(false); toast.success(`Lead scored: ${d.score}/100 → ${d.stage}`); })
      .catch(() => { setSubmitting(false); toast.error("Failed to qualify lead"); });
  }

  return (
    <div>
      <ModuleHeader
        title="Lead Qualification"
        desc="ML-style scoring + Kanban pipeline with auto-stage progression"
        icon={UserCheck}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-muted/30 w-fit">
        <button
          onClick={() => setTab("pipeline")}
          className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", tab === "pipeline" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          Pipeline ({leads.length})
        </button>
        <button
          onClick={() => setTab("qualify")}
          className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", tab === "qualify" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          Qualify New Lead
        </button>
      </div>

      {tab === "pipeline" && (
        loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {STAGES.map(s => <div key={s} className="h-64 rounded-xl glass animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGES.map(stage => {
              const items = leads.filter(l => l.stage === stage);
              const total = items.reduce((s, l) => s + l.estimatedValue, 0);
              return (
                <div key={stage} className={cn("rounded-xl p-3 border min-h-[300px]", STAGE_COLOR[stage])}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">{stage}</span>
                    <Badge variant="outline" className="text-[9px]">{items.length}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-2">INR {(total/100000).toFixed(1)}L total</div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {items.map(l => (
                      <div key={l.id} className="p-2.5 rounded-lg glass text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{l.name}</span>
                          <PriorityBadge p={l.score >= 80 ? "P0" : l.score >= 60 ? "P1" : l.score >= 40 ? "P2" : "P3"} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-1">{l.product}</div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-400">INR {(l.estimatedValue/100000).toFixed(1)}L</span>
                          <span className="font-mono font-semibold text-primary">{l.score}</span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="text-[10px] text-muted-foreground/50 text-center py-4">—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "qualify" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <SectionTitle action={<Zap className="h-3.5 w-3.5 text-primary" />}>Lead Attributes</SectionTitle>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Monthly Income: INR {income.toLocaleString("en-IN")}</Label>
                <Slider value={[income]} onValueChange={v => setIncome(v[0])} min={10000} max={500000} step={5000} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">CIBIL Score: {cibil}</Label>
                <Slider value={[cibil]} onValueChange={v => setCibil(v[0])} min={300} max={900} step={10} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Age: {age}</Label>
                <Slider value={[age]} onValueChange={v => setAge(v[0])} min={18} max={75} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Opportunity Value: INR {(sourceValue/100000).toFixed(1)}L</Label>
                <Slider value={[sourceValue]} onValueChange={v => setSourceValue(v[0])} min={100000} max={20000000} step={100000} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Interest Level</Label>
                  <Select value={interest} onValueChange={(v) => setInterest(v as "High" | "Medium" | "Low")}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Existing Customer</Label>
                  <Select value={existingCustomer ? "yes" : "no"} onValueChange={(v) => setExistingCustomer(v === "yes")}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-strong">
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={qualify} disabled={submitting} className="w-full">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> {submitting ? "Scoring..." : "Qualify Lead"}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionTitle>Scoring Result</SectionTitle>
            {!result ? (
              <EmptyState icon={Plus} message="Submit the form to see lead score & rationale" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#22d3ee" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(result.score / 100) * 264} 264`} transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{result.score}</div>
                      <div className="text-[9px] text-muted-foreground">/ 100</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Recommended Stage</div>
                    <div className="text-xl font-semibold">{result.stage}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {result.score >= 80 ? "Hot lead" : result.score >= 60 ? "Warm lead" : "Cold lead"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Scoring Rationale</div>
                  <ul className="space-y-1.5">
                    {result.rationale.map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="text-primary mt-0.5">▸</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
