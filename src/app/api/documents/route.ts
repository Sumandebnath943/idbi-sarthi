import { NextResponse } from "next/server";

// Mock OCR / document intelligence — analyze uploaded doc text
type DocType = "Aadhaar" | "PAN" | "Bank Statement" | "Salary Slip" | "ITR" | "Unknown";

export async function POST(req: Request) {
  let body: { text?: string; filename?: string };
  try {
    body = (await req.json()) as { text?: string; filename?: string };
  } catch {
    return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
  }
  // Cap payload to avoid running regexes over an unbounded string (CPU DoS guard).
  const text = (body.text ?? "").slice(0, 100000).toLowerCase();
  if (!text || text.length < 5) {
    return NextResponse.json({ error: "Text content required (min 5 chars)" }, { status: 400 });
  }

  // Classification heuristics
  let type: DocType = "Unknown";
  const signals: { label: string; confidence: number }[] = [];

  if (/\baadhaar\b|uidai|government of india|unique identification/.test(text)) {
    type = "Aadhaar"; signals.push({ label: "UIDAI keywords", confidence: 0.92 });
  } else if (/\bpan\b|permanent account|income tax department|[a-z]{5}\d{4}[a-z]/i.test(text)) {
    type = "PAN"; signals.push({ label: "PAN pattern", confidence: 0.88 });
  } else if (/account statement|transaction|debit|credit|opening balance|closing balance/.test(text)) {
    type = "Bank Statement"; signals.push({ label: "Statement structure", confidence: 0.90 });
  } else if (/salary|basic pay|hra|da|gross|net pay|employer/.test(text)) {
    type = "Salary Slip"; signals.push({ label: "Pay slip keywords", confidence: 0.86 });
  } else if (/income tax return|itr|form 16|assessable|annexure/.test(text)) {
    type = "ITR"; signals.push({ label: "ITR markers", confidence: 0.84 });
  } else {
    signals.push({ label: "No markers - default Unknown", confidence: 0.30 });
  }

  // Extract entities
  const entities: { type: string; value: string }[] = [];
  // PAN
  const pan = text.match(/\b([a-z]{5}\d{4}[a-z])\b/i);
  if (pan) entities.push({ type: "PAN Number", value: pan[1].toUpperCase() });
  // Aadhaar (masked)
  const aadhaar = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
  if (aadhaar) entities.push({ type: "Aadhaar (masked)", value: "XXXX-XXXX-" + aadhaar[0].replace(/\s/g, "").slice(-4) });
  // Phone
  const phone = text.match(/\b(\+?91[\s-]?)?[6-9]\d{9}\b/);
  if (phone) entities.push({ type: "Phone", value: phone[0] });
  // Email
  const email = text.match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i);
  if (email) entities.push({ type: "Email", value: email[0] });
  // Date
  const dates = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g);
  if (dates) entities.push({ type: "Date(s) found", value: dates.slice(0, 3).join(", ") });
  // Amounts
  const amounts = text.match(/(?:inr|rs\.?)\s?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?/gi);
  if (amounts) entities.push({ type: "Amount(s) detected", value: amounts.slice(0, 5).join(", ") });
  // Names (heuristic)
  const nameMatch = text.match(/name\s*[:\-]\s*([a-z][a-z\s.]{2,40})/i);
  if (nameMatch) entities.push({ type: "Name", value: nameMatch[1].trim() });

  // Compliance flags
  const flags: { flag: string; severity: "info" | "warning" | "error" }[] = [];
  if (type === "Aadhaar" && text.length > 2000) {
    flags.push({ flag: "Full Aadhaar number detected — mask before storage per RBI guidelines", severity: "warning" });
  }
  if (entities.find(e => e.type === "PAN Number") && entities.find(e => e.type === "Phone")) {
    flags.push({ flag: "PAN + Phone together — verify consent per DPDP Act 2023", severity: "info" });
  }
  if (type === "Bank Statement" && !dates) {
    flags.push({ flag: "Statement missing date markers — possible tampering", severity: "error" });
  }
  if (type === "Salary Slip" && !amounts) {
    flags.push({ flag: "Salary slip without amount — incomplete document", severity: "warning" });
  }

  return NextResponse.json({
    filename: body.filename ?? "document.txt",
    type,
    confidence: signals[0]?.confidence ?? 0,
    signals,
    entities,
    flags,
    summary: `${type} document processed. ${entities.length} entities extracted. ${flags.length} compliance flag(s).`,
    wordCount: text.split(/\s+/).length,
  });
}
