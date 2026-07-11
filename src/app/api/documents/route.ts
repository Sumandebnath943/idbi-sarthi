import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/data";
import {
  extractFromImage,
  extractFromPdf,
  extractFromText,
  type ExtractedFields,
  type ExtractionResult,
} from "@/lib/doc-extract";
import {
  validatePAN,
  validateAadhaar,
  validateIFSC,
  maskAadhaar,
  crossCheckCustomer,
  type CrossCheck,
  type FieldCheck,
} from "@/lib/kyc-validate";

// transformers/tesseract/unpdf are native/WASM — must run on the Node runtime.
export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_TEXT_LEN = 100_000;

type Validation = { label: string; valid: boolean; reason: string };
type Flag = { flag: string; severity: "info" | "warning" | "error" };

function buildValidations(f: ExtractedFields): Validation[] {
  const v: Validation[] = [];
  if (f.panNumber) {
    const r = validatePAN(f.panNumber);
    v.push({ label: `PAN ${f.panNumber}`, valid: r.valid, reason: r.reason });
  }
  if (f.aadhaarNumber) {
    const r = validateAadhaar(f.aadhaarNumber);
    v.push({ label: `Aadhaar ${maskAadhaar(f.aadhaarNumber)}`, valid: r.valid, reason: r.reason });
  }
  if (f.ifsc) {
    const r = validateIFSC(f.ifsc);
    v.push({ label: `IFSC ${f.ifsc}`, valid: r.valid, reason: r.reason });
  }
  return v;
}

function buildFlags(
  f: ExtractedFields,
  validations: Validation[],
  confidence: number,
  cross: CrossCheck | null
): Flag[] {
  const flags: Flag[] = [];

  const aadhaarVal = validations.find((v) => v.label.startsWith("Aadhaar"));
  if (aadhaarVal && !aadhaarVal.valid) {
    flags.push({ flag: `Aadhaar failed validation: ${aadhaarVal.reason}`, severity: "error" });
  } else if (f.aadhaarNumber) {
    flags.push({ flag: "Aadhaar detected — number masked before storage per UIDAI/RBI guidelines", severity: "info" });
  }
  const panVal = validations.find((v) => v.label.startsWith("PAN"));
  if (panVal && !panVal.valid) {
    flags.push({ flag: `PAN failed validation: ${panVal.reason}`, severity: "warning" });
  }
  if (f.panNumber && f.phone) {
    flags.push({ flag: "PAN + Phone present together — verify data-processing consent per DPDP Act 2023", severity: "info" });
  }
  if (f.documentType === "Bank Statement" && (!f.dates || f.dates.length === 0)) {
    flags.push({ flag: "Bank statement missing date markers — possible tampering, review manually", severity: "error" });
  }
  if (f.documentType === "Salary Slip" && !f.netPay && !f.grossPay) {
    flags.push({ flag: "Salary slip without pay amounts — incomplete document", severity: "warning" });
  }
  if (confidence < 0.5) {
    flags.push({ flag: "Low extraction confidence — recommend manual review before acting", severity: "warning" });
  }
  if (cross) {
    if (cross.verdict === "Mismatch") {
      flags.push({ flag: `Document does NOT match customer on file — ${cross.summary}`, severity: "error" });
    } else if (cross.verdict === "Partial Match") {
      flags.push({ flag: `Partial match against customer record — ${cross.summary}`, severity: "warning" });
    } else if (cross.verdict === "Match") {
      flags.push({ flag: `Verified against customer record — ${cross.summary}`, severity: "info" });
    }
  }
  return flags;
}

/** Flatten extracted fields into display entities, masking Aadhaar. */
function toEntities(f: ExtractedFields): { type: string; value: string }[] {
  const e: { type: string; value: string }[] = [];
  const push = (type: string, value?: string | number) => {
    if (value !== undefined && value !== null && String(value).trim()) e.push({ type, value: String(value) });
  };
  push("Name", f.name);
  push("Father's Name", f.fatherName);
  push("Date of Birth", f.dob);
  push("Gender", f.gender);
  push("PAN Number", f.panNumber);
  if (f.aadhaarNumber) push("Aadhaar (masked)", maskAadhaar(f.aadhaarNumber));
  push("Address", f.address);
  push("Phone", f.phone);
  push("Email", f.email);
  push("Account Number", f.accountNumber);
  push("IFSC", f.ifsc);
  push("Employer", f.employer);
  if (f.grossPay) push("Gross Pay", `INR ${f.grossPay.toLocaleString("en-IN")}`);
  if (f.netPay) push("Net Pay", `INR ${f.netPay.toLocaleString("en-IN")}`);
  if (f.amounts?.length) push("Amounts", f.amounts.join(", "));
  if (f.dates?.length) push("Dates", f.dates.join(", "));
  return e;
}

type ExtractionOutcome =
  | { ok: true; result: ExtractionResult; filename: string; customerId?: string }
  | { ok: false; error: string; status: number };

async function runExtraction(req: Request): Promise<ExtractionOutcome> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const customerId = (form.get("customerId") as string | null) ?? undefined;
    if (!(file instanceof File)) return { ok: false, error: "No file uploaded", status: 400 };
    if (file.size > MAX_FILE_BYTES) return { ok: false, error: "File exceeds 8 MB limit", status: 413 };

    const buf = await file.arrayBuffer();
    const type = file.type || "";
    const name = file.name || "document";

    if (type.startsWith("image/")) {
      const dataUrl = `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
      return { ok: true, result: await extractFromImage(dataUrl), filename: name, customerId };
    }
    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      return { ok: true, result: await extractFromPdf(buf), filename: name, customerId };
    }
    // treat everything else as text
    const text = new TextDecoder().decode(buf).slice(0, MAX_TEXT_LEN);
    if (text.trim().length < 5) return { ok: false, error: "Unsupported or empty file", status: 400 };
    return { ok: true, result: await extractFromText(text), filename: name, customerId };
  }

  // JSON path: pasted text (also used by the sample documents).
  let body: { text?: string; filename?: string; customerId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return { ok: false, error: "Invalid or empty JSON body", status: 400 };
  }
  const text = (body.text ?? "").slice(0, MAX_TEXT_LEN);
  if (text.trim().length < 5) return { ok: false, error: "Text content required (min 5 chars)", status: 400 };
  return { ok: true, result: await extractFromText(text), filename: body.filename ?? "document.txt", customerId: body.customerId };
}

export async function POST(req: Request) {
  const ex = await runExtraction(req);
  if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: ex.status });

  const { result, filename, customerId } = ex;
  const fields = result.fields;

  const validations = buildValidations(fields);

  let cross: CrossCheck | null = null;
  if (customerId) {
    const customer = getCustomer(customerId);
    if (customer) {
      cross = crossCheckCustomer(customer, {
        name: fields.name,
        phone: fields.phone,
        email: fields.email,
        address: fields.address,
        netPay: fields.netPay,
        grossPay: fields.grossPay,
      });
    }
  }

  const flags = buildFlags(fields, validations, result.confidence, cross);
  const entities = toEntities(fields);

  // Never return the raw Aadhaar number to the client.
  const safeFields: ExtractedFields = {
    ...fields,
    aadhaarNumber: fields.aadhaarNumber ? maskAadhaar(fields.aadhaarNumber) : undefined,
  };

  const crossChecks: FieldCheck[] = cross?.checks ?? [];

  return NextResponse.json({
    filename,
    type: fields.documentType,
    confidence: result.confidence,
    method: result.method,
    fields: safeFields,
    entities,
    validations,
    crossCheck: cross ? { verdict: cross.verdict, summary: cross.summary, checks: crossChecks } : null,
    flags,
    notes: result.notes,
    rawText: result.rawText.slice(0, 4000),
    summary: `${fields.documentType} processed via ${result.method}. ${entities.length} field(s), ${validations.length} validation(s), ${flags.length} flag(s).`,
    wordCount: result.rawText ? result.rawText.split(/\s+/).filter(Boolean).length : 0,
  });
}
