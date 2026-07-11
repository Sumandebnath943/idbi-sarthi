// Document extraction pipeline for Document Intelligence.
//
// Strategy (per the product decision — Groq vision primary, local fallback):
//   image  → Groq vision (OCR + classify + structured fields in one call)
//            └─ on no-key / failure → Tesseract.js OCR → text structuring
//   pdf    → unpdf text extraction → text structuring
//   text   → text structuring
//
// "Text structuring" itself prefers Groq (text model) and falls back to regex,
// so the whole module works with or without a GROQ_API_KEY.

import { parseJsonReply } from "./groq";
import { llmComplete, llmConfigured } from "./llm";

export type DocType =
  | "Aadhaar" | "PAN" | "Bank Statement" | "Salary Slip" | "ITR" | "Cheque" | "Unknown";

const DOC_TYPES: DocType[] = ["Aadhaar", "PAN", "Bank Statement", "Salary Slip", "ITR", "Cheque", "Unknown"];

export type ExtractedFields = {
  documentType: DocType;
  name?: string;
  fatherName?: string;
  dob?: string;
  gender?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  accountNumber?: string;
  ifsc?: string;
  employer?: string;
  grossPay?: number;
  netPay?: number;
  amounts?: string[];
  dates?: string[];
};

// e.g. "gemini-vision", "groq-vision", "gemini-text", "tesseract+regex",
// "pdf-text+regex", "regex" — the actual engine that produced the fields.
export type ExtractionMethod = string;

export type ExtractionResult = {
  fields: ExtractedFields;
  rawText: string;
  method: ExtractionMethod;
  confidence: number;
  notes: string[];
};

const SCHEMA_INSTRUCTIONS = `You extract structured data from Indian banking / KYC documents.
Return ONLY a single JSON object with these keys (omit a key if not present):
{
  "documentType": one of ["Aadhaar","PAN","Bank Statement","Salary Slip","ITR","Cheque","Unknown"],
  "name": string, "fatherName": string, "dob": "DD/MM/YYYY", "gender": string,
  "panNumber": "AAAAA9999A", "aadhaarNumber": "123412341234",
  "address": string, "phone": string, "email": string,
  "accountNumber": string, "ifsc": string,
  "employer": string, "grossPay": number, "netPay": number,
  "amounts": string[], "dates": string[],
  "confidence": number between 0 and 1
}
Rules: numbers must be plain integers (no commas or currency). Do not invent values. If unsure of the type, use "Unknown".`;

// ---- Normalization ----
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return undefined;
}

function normalizeFields(raw: Record<string, unknown>): ExtractedFields {
  const dt = str(raw.documentType) as DocType | undefined;
  const documentType: DocType = dt && DOC_TYPES.includes(dt) ? dt : "Unknown";
  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.map((x) => str(x)).filter((x): x is string => !!x).slice(0, 8) : undefined;
  return {
    documentType,
    name: str(raw.name),
    fatherName: str(raw.fatherName),
    dob: str(raw.dob),
    gender: str(raw.gender),
    panNumber: str(raw.panNumber)?.toUpperCase(),
    aadhaarNumber: str(raw.aadhaarNumber)?.replace(/\s|-/g, ""),
    address: str(raw.address),
    phone: str(raw.phone),
    email: str(raw.email)?.toLowerCase(),
    accountNumber: str(raw.accountNumber),
    ifsc: str(raw.ifsc)?.toUpperCase(),
    employer: str(raw.employer),
    grossPay: toNumber(raw.grossPay),
    netPay: toNumber(raw.netPay),
    amounts: arr(raw.amounts),
    dates: arr(raw.dates),
  };
}

// ---- Regex fallback (no LLM) ----
function classifyText(text: string): { type: DocType; confidence: number } {
  const t = text.toLowerCase();
  // Structural / keyword signals first — a bare PAN *number* appears inside many
  // documents (salary slips, statements), so it must not win over the doc's own
  // structure. The PAN pattern is only a last-resort signal below.
  if (/\baadhaar\b|uidai|government of india|unique identification/.test(t)) return { type: "Aadhaar", confidence: 0.8 };
  if (/account statement|opening balance|closing balance/.test(t)) return { type: "Bank Statement", confidence: 0.8 };
  if (/salary slip|basic pay|net pay|\bhra\b|\bda\b|gross/.test(t)) return { type: "Salary Slip", confidence: 0.76 };
  if (/income tax return|\bitr\b|form 16|assessable/.test(t)) return { type: "ITR", confidence: 0.74 };
  if (/\bcheque\b|pay to the order|a\/c payee/.test(t)) return { type: "Cheque", confidence: 0.7 };
  if (/permanent account|income tax department/.test(t)) return { type: "PAN", confidence: 0.8 };
  if (/\b[a-z]{5}\d{4}[a-z]\b/i.test(text)) return { type: "PAN", confidence: 0.55 }; // bare pattern, weak
  return { type: "Unknown", confidence: 0.3 };
}

function regexExtract(text: string): ExtractionResult {
  const { type, confidence } = classifyText(text);
  const fields: ExtractedFields = { documentType: type };

  const pan = text.match(/\b([A-Z]{5}\d{4}[A-Z])\b/i);
  if (pan) fields.panNumber = pan[1].toUpperCase();
  const aadhaar = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
  if (aadhaar) fields.aadhaarNumber = aadhaar[1].replace(/\s/g, "");
  const phone = text.match(/\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/);
  if (phone) fields.phone = phone[0];
  const email = text.match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i);
  if (email) fields.email = email[0].toLowerCase();
  const ifsc = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/);
  if (ifsc) fields.ifsc = ifsc[1].toUpperCase();
  const acct = text.match(/account\s*(?:no|number)\.?\s*[:\-]?\s*(\d{6,18})/i);
  if (acct) fields.accountNumber = acct[1];
  const name = text.match(/(?:^|\n)\s*(?:name|account holder|employee)\s*[:\-]\s*([A-Za-z][A-Za-z .]{2,40})/i);
  if (name) fields.name = name[1].trim();
  const dob = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (dob) fields.dob = dob[0];
  const dates = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g);
  if (dates) fields.dates = [...new Set(dates)].slice(0, 6);
  const amounts = text.match(/(?:inr|rs\.?)\s?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?/gi);
  if (amounts) fields.amounts = amounts.slice(0, 6);
  const net = text.match(/net\s*pay\s*[:\-]?\s*(?:inr|rs\.?)?\s?([\d,]+)/i);
  if (net) fields.netPay = parseInt(net[1].replace(/,/g, ""), 10);
  const gross = text.match(/gross\s*[:\-]?\s*(?:inr|rs\.?)?\s?([\d,]+)/i);
  if (gross) fields.grossPay = parseInt(gross[1].replace(/,/g, ""), 10);
  const employer = text.match(/employer\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9 .&]{2,40})/i);
  if (employer) fields.employer = employer[1].trim();

  return { fields, rawText: text, method: "regex", confidence, notes: [] };
}

// ---- Text structuring (LLM if available, else regex) ----
// On LLM success method is `${provider}-text` (e.g. "gemini-text"); callers use
// the "-text" suffix to tell whether structuring was LLM- or regex-based.
async function structureText(text: string): Promise<ExtractionResult> {
  if (llmConfigured()) {
    try {
      const { text: reply, provider } = await llmComplete(
        [
          { role: "system", content: SCHEMA_INSTRUCTIONS },
          { role: "user", content: `Document text (OCR):\n"""\n${text.slice(0, 8000)}\n"""` },
        ],
        { jsonMode: true, temperature: 0.1, maxTokens: 900 }
      );
      const parsed = parseJsonReply<Record<string, unknown>>(reply);
      const fields = normalizeFields(parsed);
      const confidence = toNumber(parsed.confidence) != null ? Number(parsed.confidence) : 0.85;
      return { fields, rawText: text, method: `${provider}-text`, confidence: Math.min(1, confidence), notes: [] };
    } catch (e) {
      const r = regexExtract(text);
      return { ...r, notes: [`LLM structuring failed, used regex: ${(e as Error).message}`] };
    }
  }
  return regexExtract(text);
}

// ---- Public entry points ----
export async function extractFromImage(dataUrl: string): Promise<ExtractionResult> {
  if (llmConfigured()) {
    try {
      const { text: reply, provider } = await llmComplete(
        [
          { role: "system", content: SCHEMA_INSTRUCTIONS },
          {
            role: "user",
            content: [
              { type: "text", text: "Read this Indian banking/KYC document and extract the fields as JSON. Also include a short 'rawText' of the visible text." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        { jsonMode: true, temperature: 0.1, maxTokens: 1100 }
      );
      const parsed = parseJsonReply<Record<string, unknown>>(reply);
      const fields = normalizeFields(parsed);
      const confidence = toNumber(parsed.confidence) != null ? Number(parsed.confidence) : 0.9;
      const rawText = str(parsed.rawText) ?? "";
      return { fields, rawText, method: `${provider}-vision`, confidence: Math.min(1, confidence), notes: [] };
    } catch (e) {
      // Fall through to local OCR.
      const notes = [`Vision extraction failed, used local OCR: ${(e as Error).message}`];
      const r = await ocrImage(dataUrl);
      return { ...r, notes: [...notes, ...r.notes] };
    }
  }
  const r = await ocrImage(dataUrl);
  return { ...r, notes: ["No LLM key set — used local Tesseract OCR (lower accuracy on IDs).", ...r.notes] };
}

async function ocrImage(dataUrl: string): Promise<ExtractionResult> {
  try {
    const { recognize } = await import("tesseract.js");
    const { data } = await recognize(dataUrl, "eng");
    const text = data.text ?? "";
    if (text.trim().length < 5) {
      return { fields: { documentType: "Unknown" }, rawText: text, method: "tesseract+regex", confidence: 0.2, notes: ["OCR produced little text."] };
    }
    const structured = await structureText(text);
    return { ...structured, method: structured.method.endsWith("-text") ? structured.method : "tesseract+regex" };
  } catch (e) {
    return { fields: { documentType: "Unknown" }, rawText: "", method: "tesseract+regex", confidence: 0, notes: [`OCR failed: ${(e as Error).message}`] };
  }
}

export async function extractFromPdf(buffer: ArrayBuffer): Promise<ExtractionResult> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = Array.isArray(text) ? text.join("\n") : text;
    if (!merged || merged.trim().length < 5) {
      return {
        fields: { documentType: "Unknown" },
        rawText: "",
        method: "pdf-text+regex",
        confidence: 0.2,
        notes: ["PDF has no extractable text (likely scanned) — upload a page image for OCR."],
      };
    }
    const structured = await structureText(merged);
    return { ...structured, method: structured.method.endsWith("-text") ? structured.method : "pdf-text+regex" };
  } catch (e) {
    return { fields: { documentType: "Unknown" }, rawText: "", method: "pdf-text+regex", confidence: 0, notes: [`PDF parse failed: ${(e as Error).message}`] };
  }
}

export async function extractFromText(text: string): Promise<ExtractionResult> {
  return structureText(text);
}
