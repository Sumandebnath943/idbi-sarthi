"use client";

import { useState } from "react";
import { FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, XCircle, Tag, Database, ScanLine } from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, EmptyState } from "@/components/shell/primitives";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AnalysisResult = {
  filename: string;
  type: string;
  confidence: number;
  signals: { label: string; confidence: number }[];
  entities: { type: string; value: string }[];
  flags: { flag: string; severity: "info" | "warning" | "error" }[];
  summary: string;
  wordCount: number;
};

const SAMPLE_DOCS: { name: string; text: string }[] = [
  {
    name: "aadhaar_sample.txt",
    text: `Government of India
Aadhaar Card
Name: Rahul Sharma
UID: 1234 5678 9012
DOB: 15/08/1990
Address: 12 MG Road, Bengaluru, KA 560001
Phone: +91 9876543210
Email: rahul.sharma@email.com
Gender: Male`,
  },
  {
    name: "pan_sample.txt",
    text: `INCOME TAX DEPARTMENT
Permanent Account Number Card
Name: Priya Iyer
Father's Name: Suresh Iyer
DOB: 22/03/1988
PAN: ABCDE1234F
Signature`,
  },
  {
    name: "bank_statement_sample.txt",
    text: `Account Statement
Account No: 1234567890
Account Holder: Karthik Reddy
Period: 01/01/2025 to 31/03/2025
Opening Balance: INR 2,50,000
01/01/2025 Salary Credit +INR 85,000
05/01/2025 Amazon Purchase -INR 3,499
10/01/2025 Electricity Bill -INR 1,200
15/01/2025 MF SIP -INR 10,000
31/03/2025 Closing Balance: INR 3,20,300`,
  },
  {
    name: "salary_slip_sample.txt",
    text: `Salary Slip - March 2025
Employee: Sneha Patel
Employer: Acme Corp Pvt Ltd
Basic Pay: INR 50,000
HRA: INR 20,000
DA: INR 5,000
Gross: INR 75,000
TDS: INR 5,000
Net Pay: INR 70,000
PAN: XYZPA5678G`,
  },
];

const SEVERITY_ICON = {
  info: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};
const SEVERITY_COLOR = {
  info: "text-cyan-600 bg-cyan-500/10 border-cyan-500/30",
  warning: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  error: "text-red-600 bg-red-500/10 border-red-500/30",
};

export function DocumentIntelligence() {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("document.txt");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  function analyze() {
    if (text.trim().length < 5) { toast.error("Enter at least 5 characters of document text"); return; }
    setLoading(true);
    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, filename }),
    })
      .then(r => r.json())
      .then(d => { setResult(d); setLoading(false); toast.success("Document analyzed"); })
      .catch(() => { setLoading(false); toast.error("Analysis failed"); });
  }

  function loadSample(s: { name: string; text: string }) {
    setText(s.text);
    setFilename(s.name);
    setResult(null);
  }

  return (
    <div>
      <ModuleHeader
        title="Document Intelligence"
        desc="OCR-style classification, entity extraction & compliance flagging"
        icon={FileText}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <SectionTitle action={<Upload className="h-3.5 w-3.5 text-primary" />}>Document Input</SectionTitle>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Filename</Label>
                <input
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  className="mt-1 w-full bg-card/60 border border-border/60 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <Label className="text-xs">Document Text (simulated OCR output)</Label>
                <Textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Paste extracted text from a customer document (Aadhaar, PAN, bank statement, salary slip, ITR)..."
                  className="glass mt-1 min-h-[180px] font-mono text-[11px]"
                />
              </div>
              <Button onClick={analyze} disabled={loading} className="w-full">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Analyzing..." : "Analyze Document"}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <ScanLine className="h-3 w-3" /> Sample Documents
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_DOCS.map(s => (
                <button
                  key={s.name}
                  onClick={() => loadSample(s)}
                  className="text-left text-[11px] p-2 rounded-lg bg-muted/30 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <GlassCard className="p-5 h-full flex items-center justify-center">
              <EmptyState icon={FileText} message="Analyze a document to see classification, entities & compliance flags" />
            </GlassCard>
          )}

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              {/* Classification */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Document Type</div>
                    <div className="text-xl font-bold">{result.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
                    <div className="text-xl font-bold text-primary">{(result.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{result.summary}</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.signals.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">
                      {s.label} ({(s.confidence * 100).toFixed(0)}%)
                    </Badge>
                  ))}
                </div>
              </GlassCard>

              {/* Entities */}
              <GlassCard className="p-4">
                <SectionTitle action={<Tag className="h-3.5 w-3.5 text-primary" />}>Extracted Entities</SectionTitle>
                {result.entities.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No entities detected</div>
                ) : (
                  <div className="space-y-1.5">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                        <span className="text-muted-foreground">{e.type}</span>
                        <span className="font-mono font-medium">{e.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Compliance */}
              <GlassCard className="p-4">
                <SectionTitle action={<Database className="h-3.5 w-3.5 text-primary" />}>Compliance Flags</SectionTitle>
                {result.flags.length === 0 ? (
                  <div className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> No compliance issues detected
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {result.flags.map((f, i) => {
                      const Icon = SEVERITY_ICON[f.severity];
                      return (
                        <div key={i} className={cn("flex items-start gap-2 p-2 rounded-lg border text-[11px]", SEVERITY_COLOR[f.severity])}>
                          <Icon className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{f.flag}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                  Word count: {result.wordCount}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
