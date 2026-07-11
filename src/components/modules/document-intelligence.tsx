"use client";

import { useRef, useState } from "react";
import {
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Tag, Database, ScanLine, ShieldCheck, FileUp, X,
} from "lucide-react";
import { ModuleHeader, GlassCard, SectionTitle, EmptyState } from "@/components/shell/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Validation = { label: string; valid: boolean; reason: string };
type FieldCheck = { field: string; documentValue: string; customerValue: string; status: "match" | "mismatch" | "unverified" };
type CrossCheck = { verdict: "Match" | "Partial Match" | "Mismatch" | "Insufficient Data"; summary: string; checks: FieldCheck[] };

type AnalysisResult = {
  filename: string;
  type: string;
  confidence: number;
  method: string;
  entities: { type: string; value: string }[];
  validations: Validation[];
  crossCheck: CrossCheck | null;
  flags: { flag: string; severity: "info" | "warning" | "error" }[];
  notes: string[];
  summary: string;
  wordCount: number;
};

const SAMPLE_DOCS: { name: string; text: string }[] = [
  {
    name: "aadhaar_sample.txt",
    text: `Government of India
Aadhaar Card
Name: Rahul Sharma
UID: 2345 6789 0124
DOB: 15/08/1990
Address: 12 MG Road, Bengaluru, KA 560001
Phone: +91 9876543210
Gender: Male`,
  },
  {
    name: "pan_sample.txt",
    text: `INCOME TAX DEPARTMENT
Permanent Account Number Card
Name: Priya Iyer
Father's Name: Suresh Iyer
DOB: 22/03/1988
PAN: ABCPE1234F`,
  },
  {
    name: "bank_statement_sample.txt",
    text: `Account Statement
Account No: 1234567890
Account Holder: Karthik Reddy
IFSC: IBKL0001234
Period: 01/01/2025 to 31/03/2025
Opening Balance: INR 2,50,000
01/01/2025 Salary Credit +INR 85,000
05/01/2025 Amazon Purchase -INR 3,499
31/03/2025 Closing Balance: INR 3,20,300`,
  },
  {
    name: "salary_slip_sample.txt",
    text: `Salary Slip - March 2025
Employee: Sneha Patel
Employer: Acme Corp Pvt Ltd
Basic Pay: INR 50,000
HRA: INR 20,000
Gross: INR 75,000
TDS: INR 5,000
Net Pay: INR 70,000
PAN: ABCPE5678G`,
  },
];

const SEVERITY_ICON = { info: CheckCircle2, warning: AlertTriangle, error: XCircle };
const SEVERITY_COLOR = {
  info: "text-cyan-600 bg-cyan-500/10 border-cyan-500/30",
  warning: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  error: "text-red-600 bg-red-500/10 border-red-500/30",
};

const VERDICT_STYLE: Record<CrossCheck["verdict"], string> = {
  "Match": "text-emerald-700 bg-emerald-500/10 border-emerald-500/30",
  "Partial Match": "text-amber-700 bg-amber-500/10 border-amber-500/30",
  "Mismatch": "text-red-700 bg-red-500/10 border-red-500/30",
  "Insufficient Data": "text-muted-foreground bg-muted/30 border-border/40",
};

export function DocumentIntelligence() {
  const [file, setFile] = useState<File | null>(null);
  const [sampleText, setSampleText] = useState<string>("");
  const [filename, setFilename] = useState("document.txt");
  const [customerId, setCustomerId] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setSampleText("");
    setFilename(f.name);
    setResult(null);
  }

  function loadSample(s: { name: string; text: string }) {
    setSampleText(s.text);
    setFile(null);
    setFilename(s.name);
    setResult(null);
  }

  function clearInput() {
    setFile(null);
    setSampleText("");
    setFilename("document.txt");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    if (!file && sampleText.trim().length < 5) {
      toast.error("Upload a document or load a sample first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        if (customerId) fd.append("customerId", customerId);
        res = await fetch("/api/documents", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sampleText, filename, customerId: customerId || undefined }),
        });
      }
      if (!res.ok) throw new Error("bad response");
      const d = await res.json();
      setResult(d);
      toast.success("Document analyzed");
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ModuleHeader
        title="Document Intelligence"
        desc="Upload → OCR + classification, entity extraction, KYC validation & customer verification"
        icon={FileText}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <SectionTitle action={<Upload className="h-3.5 w-3.5 text-primary" />}>Upload Document</SectionTitle>

            {/* Dropzone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
              className={cn(
                "mt-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf,.txt"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <FileUp className="h-7 w-7 mx-auto text-primary/70 mb-2" />
              <div className="text-xs font-medium">Drop an image or PDF here, or click to browse</div>
              <div className="text-[10px] text-muted-foreground mt-1">Aadhaar · PAN · Bank Statement · Salary Slip · ITR — max 8 MB</div>
            </div>

            {(file || sampleText) && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{filename}</span>
                  <Badge variant="outline" className="text-[9px] shrink-0">{file ? "file" : "sample text"}</Badge>
                </span>
                <button onClick={clearInput} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            <div className="mt-4">
              <CustomerPicker value={customerId} onChange={setCustomerId} label="Verify against customer (optional)" />
            </div>

            <Button onClick={analyze} disabled={loading} className="w-full mt-4">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Analyzing..." : "Analyze Document"}
            </Button>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <ScanLine className="h-3 w-3" /> Sample Documents (text)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_DOCS.map((s) => (
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
              <EmptyState icon={FileText} message="Analyze a document to see classification, entities, validation & verification" />
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
                <Badge variant="outline" className="text-[9px]">engine: {result.method}</Badge>
              </GlassCard>

              {/* Cross-check verdict */}
              {result.crossCheck && (
                <GlassCard className="p-4">
                  <SectionTitle action={<ShieldCheck className="h-3.5 w-3.5 text-primary" />}>Customer Verification</SectionTitle>
                  <div className={cn("rounded-lg border px-3 py-2 text-xs font-semibold mb-2 inline-block", VERDICT_STYLE[result.crossCheck.verdict])}>
                    {result.crossCheck.verdict}
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">{result.crossCheck.summary}</div>
                  {result.crossCheck.checks.length > 0 && (
                    <div className="space-y-1.5">
                      {result.crossCheck.checks.map((c, i) => {
                        const Icon = c.status === "match" ? CheckCircle2 : c.status === "mismatch" ? XCircle : AlertTriangle;
                        const color = c.status === "match" ? "text-emerald-600" : c.status === "mismatch" ? "text-red-600" : "text-amber-600";
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 text-[11px]">
                            <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className={cn("h-3 w-3", color)} />{c.field}</span>
                            <span className="font-mono text-right">
                              <span className={color}>{c.documentValue}</span>
                              <span className="text-muted-foreground"> vs {c.customerValue}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Validations */}
              {result.validations.length > 0 && (
                <GlassCard className="p-4">
                  <SectionTitle action={<ShieldCheck className="h-3.5 w-3.5 text-primary" />}>KYC Validation</SectionTitle>
                  <div className="space-y-1.5">
                    {result.validations.map((v, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/30 text-[11px]">
                        <span className="font-mono">{v.label}</span>
                        <span className={cn("flex items-center gap-1 shrink-0", v.valid ? "text-emerald-600" : "text-red-600")}>
                          {v.valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {v.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Entities */}
              <GlassCard className="p-4">
                <SectionTitle action={<Tag className="h-3.5 w-3.5 text-primary" />}>Extracted Fields</SectionTitle>
                {result.entities.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No fields detected</div>
                ) : (
                  <div className="space-y-1.5">
                    {result.entities.map((e, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 text-xs">
                        <span className="text-muted-foreground shrink-0">{e.type}</span>
                        <span className="font-mono font-medium text-right break-all">{e.value}</span>
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
                {result.notes.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/40 space-y-1">
                    {result.notes.map((n, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">ℹ {n}</div>
                    ))}
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
