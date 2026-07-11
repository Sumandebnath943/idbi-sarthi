// Deterministic KYC validators + Customer-360 cross-check.
//
// These run regardless of which extraction path (Groq vision / Tesseract / regex)
// produced the fields, so document verification never depends on an LLM being
// available or honest — the checksums and comparisons are pure functions.

import type { Customer } from "./data";

// ---- PAN ----
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function validatePAN(pan: string): { valid: boolean; reason: string } {
  const v = pan.trim().toUpperCase();
  if (!PAN_RE.test(v)) return { valid: false, reason: "Does not match PAN format (AAAAA9999A)" };
  // 4th char encodes holder type; 'P' = individual, common valid values below.
  const holderType = v[3];
  if (!"ABCFGHLJPTKE".includes(holderType)) {
    return { valid: false, reason: `Unrecognized PAN holder-type character '${holderType}'` };
  }
  return { valid: true, reason: "Valid PAN format" };
}

// ---- Aadhaar (Verhoeff checksum) ----
// Aadhaar's 12th digit is a Verhoeff check digit over the first 11.
const D_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffValid(num: string): boolean {
  let c = 0;
  const rev = num.split("").reverse();
  for (let i = 0; i < rev.length; i++) {
    const digit = parseInt(rev[i], 10);
    if (Number.isNaN(digit)) return false;
    c = D_TABLE[c][P_TABLE[i % 8][digit]];
  }
  return c === 0;
}

export function validateAadhaar(aadhaar: string): { valid: boolean; reason: string } {
  const v = aadhaar.replace(/\s|-/g, "");
  if (!/^\d{12}$/.test(v)) return { valid: false, reason: "Aadhaar must be 12 digits" };
  if (v[0] === "0" || v[0] === "1") return { valid: false, reason: "Aadhaar cannot start with 0 or 1" };
  if (!verhoeffValid(v)) return { valid: false, reason: "Verhoeff checksum failed — likely invalid or mistyped" };
  return { valid: true, reason: "Valid Aadhaar (checksum passed)" };
}

// ---- IFSC ----
export function validateIFSC(ifsc: string): { valid: boolean; reason: string } {
  const v = ifsc.trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) return { valid: false, reason: "Invalid IFSC format (AAAA0999999)" };
  return { valid: true, reason: "Valid IFSC format" };
}

// ---- Masking ----
export function maskAadhaar(aadhaar: string): string {
  const v = aadhaar.replace(/\s|-/g, "");
  if (v.length < 4) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${v.slice(-4)}`;
}

// ---- Name matching ----
function normalizeName(n: string): string[] {
  return n
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|shri|smt|kum)\.?\b/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when every token of the shorter name appears in the longer one. */
export function nameMatches(a: string, b: string): boolean {
  const ta = normalizeName(a);
  const tb = normalizeName(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return short.every((t) => long.includes(t));
}

// ---- Customer 360 cross-check ----
export type FieldCheck = {
  field: string;
  documentValue: string;
  customerValue: string;
  status: "match" | "mismatch" | "unverified";
};

export type CrossCheck = {
  verdict: "Match" | "Partial Match" | "Mismatch" | "Insufficient Data";
  checks: FieldCheck[];
  summary: string;
};

export type ExtractedForCheck = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  netPay?: number;
  grossPay?: number;
};

function digits(s: string): string {
  return s.replace(/\D/g, "").slice(-10);
}

/** Compare extracted document fields against the on-file customer record. */
export function crossCheckCustomer(customer: Customer, f: ExtractedForCheck): CrossCheck {
  const checks: FieldCheck[] = [];

  if (f.name) {
    checks.push({
      field: "Name",
      documentValue: f.name,
      customerValue: customer.name,
      status: nameMatches(f.name, customer.name) ? "match" : "mismatch",
    });
  }
  if (f.phone) {
    checks.push({
      field: "Phone",
      documentValue: f.phone,
      customerValue: customer.phone,
      status: digits(f.phone) && digits(f.phone) === digits(customer.phone) ? "match" : "mismatch",
    });
  }
  if (f.email) {
    checks.push({
      field: "Email",
      documentValue: f.email,
      customerValue: customer.email,
      status: f.email.trim().toLowerCase() === customer.email.toLowerCase() ? "match" : "mismatch",
    });
  }
  if (f.address && customer.city) {
    checks.push({
      field: "City",
      documentValue: f.address,
      customerValue: customer.city,
      status: f.address.toLowerCase().includes(customer.city.toLowerCase()) ? "match" : "unverified",
    });
  }
  const pay = f.netPay ?? f.grossPay;
  if (typeof pay === "number" && pay > 0) {
    // Salary slip net/gross vs on-file monthly income, 20% tolerance.
    const within = Math.abs(pay - customer.monthlyIncome) / customer.monthlyIncome <= 0.2;
    checks.push({
      field: "Monthly Income",
      documentValue: `INR ${pay.toLocaleString("en-IN")}`,
      customerValue: `INR ${customer.monthlyIncome.toLocaleString("en-IN")}`,
      status: within ? "match" : "mismatch",
    });
  }

  if (checks.length === 0) {
    return {
      verdict: "Insufficient Data",
      checks,
      summary: `No comparable identity fields were extracted to verify against ${customer.name}.`,
    };
  }

  const mismatches = checks.filter((c) => c.status === "mismatch").length;
  const matches = checks.filter((c) => c.status === "match").length;
  const identityMismatch = checks.some((c) => c.field === "Name" && c.status === "mismatch");

  let verdict: CrossCheck["verdict"];
  if (identityMismatch || mismatches > matches) verdict = "Mismatch";
  else if (mismatches === 0) verdict = "Match";
  else verdict = "Partial Match";

  return {
    verdict,
    checks,
    summary: `${matches}/${checks.length} field(s) matched on-file record for ${customer.name}.`,
  };
}
