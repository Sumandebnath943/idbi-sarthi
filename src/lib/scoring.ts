// Scoring / Recommendation / Risk / NBA engines
// All logic is deterministic & explainable (no black-box LLM call needed for scoring).

import { customers, leads, policies, schemes, loanProducts, rms, type Customer, type Lead } from "./data";

// ---- Financial Health Score ----
// 0-900 weighted score with 5 factors
export type HealthScoreBreakdown = {
  score: number; // 0-900
  band: "Excellent" | "Good" | "Fair" | "Poor";
  factors: {
    key: string;
    label: string;
    weight: number; // 0..1, sum = 1
    raw: number; // 0..1 normalized
    weighted: number; // raw * weight * 900
    description: string;
  }[];
};

export function healthScore(c: Customer): HealthScoreBreakdown {
  // Savings ratio
  const savingsRatio = c.monthlyIncome > 0
    ? Math.min(1, (c.monthlyIncome - c.monthlyExpense) / c.monthlyIncome / 0.4)
    : 0;
  // Credit utilization (lower is better)
  const utilScore = Math.max(0, 1 - c.creditUtilization);
  // EMI burden (lower is better)
  const emiScore = Math.max(0, 1 - c.emiBurden / 0.6);
  // Digital engagement
  const digiScore = c.digitalEngagement;
  // Product diversification
  const productScore = Math.min(1, c.numProducts / 8);
  // Stability = ratio of savings + investments to annual income
  const annualIncome = c.monthlyIncome * 12;
  const stability = annualIncome > 0
    ? Math.min(1, (c.totalSavings + c.totalInvestments) / (annualIncome * 2))
    : 0;

  const factors = [
    { key: "savings", label: "Savings Ratio", weight: 0.22, raw: savingsRatio,
      description: savingsRatio > 0.8 ? "Strong monthly surplus" : savingsRatio > 0.5 ? "Adequate savings" : "Below recommended 20% savings rate" },
    { key: "credit", label: "Credit Utilization", weight: 0.20, raw: utilScore,
      description: c.creditUtilization < 0.3 ? "Healthy utilization" : c.creditUtilization < 0.6 ? "Moderate utilization" : "High utilization - reduce outstanding" },
    { key: "emi", label: "EMI Burden", weight: 0.18, raw: emiScore,
      description: c.emiBurden < 0.3 ? "Comfortable EMI load" : c.emiBurden < 0.5 ? "Manageable EMI" : "High EMI burden - caution" },
    { key: "stability", label: "Financial Stability", weight: 0.18, raw: stability,
      description: stability > 0.6 ? "Strong liquid net worth" : stability > 0.3 ? "Building stability" : "Limited liquid reserves" },
    { key: "digital", label: "Digital Engagement", weight: 0.12, raw: digiScore,
      description: digiScore > 0.7 ? "Active digital customer" : digiScore > 0.4 ? "Moderate digital usage" : "Low digital engagement" },
    { key: "diversification", label: "Product Diversification", weight: 0.10, raw: productScore,
      description: productScore > 0.6 ? "Well diversified" : productScore > 0.3 ? "Some diversification" : "Limited product mix" },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.raw * f.weight * 900, 0));
  const band = score >= 720 ? "Excellent" : score >= 600 ? "Good" : score >= 480 ? "Fair" : "Poor";

  return {
    score,
    band,
    factors: factors.map(f => ({ ...f, weighted: Math.round(f.raw * f.weight * 900) })),
  };
}

// ---- Risk Prediction ----
export type RiskAssessment = {
  probability: number; // 0..1 probability of default in next 12 months
  band: "Low" | "Moderate" | "High" | "Critical";
  drivers: { label: string; impact: number }[]; // -1..1
  recommendation: string;
  smaStage: "None" | "SMA-0" | "SMA-1" | "SMA-2" | "NPA";
};

export function riskPredict(c: Customer): RiskAssessment {
  let p = 0.05; // base
  const drivers: { label: string; impact: number }[] = [];

  if (c.creditUtilization > 0.5) {
    const d = Math.min(0.25, (c.creditUtilization - 0.5) * 0.5);
    p += d; drivers.push({ label: "High Credit Utilization", impact: d });
  }
  if (c.emiBurden > 0.4) {
    const d = Math.min(0.20, (c.emiBurden - 0.4) * 0.6);
    p += d; drivers.push({ label: "Elevated EMI Burden", impact: d });
  }
  if (c.monthlyIncome > 0 && c.monthlyExpense / c.monthlyIncome > 0.7) {
    const d = 0.10; p += d;
    drivers.push({ label: "High Expense Ratio", impact: d });
  }
  if (c.digitalEngagement < 0.3) {
    p += 0.05; drivers.push({ label: "Low Digital Engagement", impact: 0.05 });
  }
  if (c.numTransactions30d < 10) {
    p += 0.04; drivers.push({ label: "Account Inactivity", impact: 0.04 });
  }
  if (c.npaFlag) {
    p += 0.30; drivers.push({ label: "Existing NPA Flag", impact: 0.30 });
  }
  // Savings safety net reduces risk
  const reserveRatio = c.monthlyIncome > 0 ? (c.totalSavings / (c.monthlyIncome * 6)) : 0;
  if (reserveRatio > 1) {
    const d = -0.08; p += d;
    drivers.push({ label: "Strong Emergency Fund", impact: d });
  }

  p = Math.max(0.02, Math.min(0.85, p));
  const band: RiskAssessment["band"] = p < 0.10 ? "Low" : p < 0.25 ? "Moderate" : p < 0.50 ? "High" : "Critical";
  const smaStage: RiskAssessment["smaStage"] =
    c.npaFlag ? "NPA" : p > 0.4 ? "SMA-2" : p > 0.25 ? "SMA-1" : p > 0.15 ? "SMA-0" : "None";

  const recommendation = band === "Critical"
    ? "Immediate RM escalation. Initiate recovery proceedings per POL-005. Restructure or SARFAESI."
    : band === "High"
    ? "Proactive outreach within 7 days. Review EMI structure. Offer top-up protection products."
    : band === "Moderate"
    ? "Quarterly monitoring. Suggest debt consolidation or balance transfer to lower EMI burden."
    : "Annual review sufficient. Consider cross-sell of wealth products.";

  return { probability: p, band, drivers, recommendation, smaStage };
}

// ---- Loan Recommendation ----
export type LoanRecommendation = {
  product: typeof loanProducts[number];
  matchScore: number; // 0..100
  estimatedRate: number;
  estimatedEMI: number;
  reasons: string[];
  eligible: boolean;
};

export function recommendLoans(c: Customer, amount: number, tenureMonths: number): LoanRecommendation[] {
  const cibil = 650 + Math.round((1 - c.creditUtilization) * 100) + Math.round((1 - c.emiBurden) * 80);
  const out: LoanRecommendation[] = [];

  for (const p of loanProducts) {
    if (amount < p.minAmount || amount > p.maxAmount) continue;
    if (tenureMonths < p.minTenureMonths || tenureMonths > p.maxTenureMonths) continue;

    const reasons: string[] = [];
    let score = 50;

    const incomeOk = c.monthlyIncome >= p.eligibility.minIncome;
    const cibilOk = cibil >= p.eligibility.minCibil;
    const emiOk = c.emiBurden <= p.eligibility.maxEmiBurden;

    if (incomeOk) { score += 15; reasons.push(`Income ${c.monthlyIncome.toLocaleString("en-IN")} meets minimum ${p.eligibility.minIncome.toLocaleString("en-IN")}`); }
    else { reasons.push(`Income below minimum ${p.eligibility.minIncome.toLocaleString("en-IN")}`); }

    if (cibilOk) { score += 20; reasons.push(`Estimated CIBIL ${cibil} ≥ required ${p.eligibility.minCibil}`); }
    else { reasons.push(`Estimated CIBIL ${cibil} below required ${p.eligibility.minCibil}`); }

    if (emiOk) { score += 15; reasons.push(`EMI burden ${(c.emiBurden*100).toFixed(0)}% within limit ${(p.eligibility.maxEmiBurden*100).toFixed(0)}%`); }
    else { reasons.push(`EMI burden exceeds ${(p.eligibility.maxEmiBurden*100).toFixed(0)}%`); }

    // segment preference
    if (c.segment === "Wealth" && p.type === "Home Loan") { score += 8; reasons.push("Wealth segment preferential pricing"); }
    if (c.segment === "Retail" && p.type === "Personal Loan") { score += 5; reasons.push("Tailored for retail segment"); }

    // tenure fit
    const tenureFit = 1 - Math.abs((tenureMonths - (p.minTenureMonths + p.maxTenureMonths) / 2)) / ((p.maxTenureMonths - p.minTenureMonths) / 2);
    score += Math.round(Math.max(0, tenureFit) * 10);

    score = Math.max(20, Math.min(98, score));
    const eligible = incomeOk && cibilOk && emiOk;
    const estimatedRate = p.baseRate + (eligible ? 0 : 1.5) - (score > 85 ? 0.25 : 0);
    const r = estimatedRate / 12 / 100;
    const n = tenureMonths;
    const estimatedEMI = Math.round((amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

    out.push({ product: p, matchScore: score, estimatedRate, estimatedEMI, reasons, eligible });
  }
  return out.sort((a, b) => b.matchScore - a.matchScore);
}

// ---- Lead Qualification ----
export type LeadScoreInput = {
  income: number;
  cibil: number;
  age: number;
  existingCustomer: boolean;
  interest: "High" | "Medium" | "Low";
  sourceValue: number;
};

export function qualifyLead(input: LeadScoreInput): {
  score: number;
  stage: Lead["stage"];
  rationale: string[];
} {
  let s = 0;
  const r: string[] = [];
  // income
  if (input.income >= 100000) { s += 25; r.push("High income tier"); }
  else if (input.income >= 50000) { s += 18; r.push("Mid income tier"); }
  else if (input.income >= 25000) { s += 12; r.push("Eligible income band"); }
  else { s += 4; r.push("Below standard income threshold"); }
  // cibil
  if (input.cibil >= 800) { s += 25; r.push("Excellent CIBIL"); }
  else if (input.cibil >= 750) { s += 20; r.push("Strong CIBIL"); }
  else if (input.cibil >= 700) { s += 14; r.push("Acceptable CIBIL"); }
  else { s += 5; r.push("CIBIL below threshold"); }
  // age
  if (input.age >= 28 && input.age <= 55) { s += 15; r.push("Prime age band"); }
  else { s += 8; r.push("Age outside prime band"); }
  // existing customer
  if (input.existingCustomer) { s += 15; r.push("Existing relationship - faster conversion"); }
  else { s += 8; r.push("New customer - longer onboarding"); }
  // interest
  if (input.interest === "High") { s += 12; r.push("Customer explicitly requested"); }
  else if (input.interest === "Medium") { s += 6; r.push("Soft interest"); }
  else { s += 2; r.push("Low intent"); }
  // source
  if (input.sourceValue >= 5000000) { s += 8; r.push("High-value opportunity"); }
  else if (input.sourceValue >= 1000000) { s += 5; r.push("Mid-value opportunity"); }
  else { s += 2; }

  s = Math.max(5, Math.min(99, s));
  const stage: Lead["stage"] = s >= 80 ? "Negotiation" : s >= 60 ? "Proposal" : s >= 40 ? "Qualified" : "New";
  return { score: s, stage, rationale: r };
}

// ---- Explainable AI (SHAP-style heuristic) ----
// Returns per-feature contributions to a binary outcome (e.g. "approve loan").
// NOTE: this is a transparent rule-based approximation, not true SHAP —
// contributions are independent heuristics and do not strictly sum to
// (prediction - baseValue). Presented as an interpretable proxy, not a
// game-theoretic attribution.
export function explainDecision(c: Customer): {
  outcome: "Approve" | "Review" | "Decline";
  baseValue: number;
  features: { name: string; value: string; contribution: number; direction: "positive" | "negative" | "neutral" }[];
} {
  const f: { name: string; value: string; contribution: number; direction: "positive" | "negative" | "neutral" }[] = [];

  // Base = expected approval rate
  let v = 0.45;

  // CIBIL (estimated)
  const cibil = 650 + Math.round((1 - c.creditUtilization) * 100) + Math.round((1 - c.emiBurden) * 80);
  const cibilContrib = (cibil - 720) / 200; // -0.35 to +0.30 range
  v += cibilContrib;
  f.push({ name: "CIBIL Score", value: `${cibil}`, contribution: Math.round(cibilContrib * 100) / 100, direction: cibilContrib > 0.05 ? "positive" : cibilContrib < -0.05 ? "negative" : "neutral" });

  // Income
  const incomeContrib = c.monthlyIncome > 100000 ? 0.15 : c.monthlyIncome > 50000 ? 0.08 : c.monthlyIncome > 25000 ? 0.02 : -0.10;
  v += incomeContrib;
  f.push({ name: "Monthly Income", value: `INR ${c.monthlyIncome.toLocaleString("en-IN")}`, contribution: Math.round(incomeContrib * 100) / 100, direction: incomeContrib > 0.05 ? "positive" : incomeContrib < -0.05 ? "negative" : "neutral" });

  // EMI Burden
  const emiContrib = -((c.emiBurden - 0.3) * 0.6);
  v += emiContrib;
  f.push({ name: "EMI Burden", value: `${(c.emiBurden * 100).toFixed(0)}%`, contribution: Math.round(emiContrib * 100) / 100, direction: emiContrib > 0.05 ? "positive" : emiContrib < -0.05 ? "negative" : "neutral" });

  // Credit Utilization
  const utilContrib = -((c.creditUtilization - 0.3) * 0.5);
  v += utilContrib;
  f.push({ name: "Credit Utilization", value: `${(c.creditUtilization * 100).toFixed(0)}%`, contribution: Math.round(utilContrib * 100) / 100, direction: utilContrib > 0.05 ? "positive" : utilContrib < -0.05 ? "negative" : "neutral" });

  // Banking relationship
  const relContrib = c.numProducts >= 5 ? 0.10 : c.numProducts >= 3 ? 0.05 : 0;
  v += relContrib;
  f.push({ name: "Product Holdings", value: `${c.numProducts}`, contribution: Math.round(relContrib * 100) / 100, direction: relContrib > 0.05 ? "positive" : relContrib < -0.05 ? "negative" : "neutral" });

  // Digital engagement
  const digiContrib = (c.digitalEngagement - 0.5) * 0.10;
  v += digiContrib;
  f.push({ name: "Digital Engagement", value: `${(c.digitalEngagement * 100).toFixed(0)}%`, contribution: Math.round(digiContrib * 100) / 100, direction: digiContrib > 0.05 ? "positive" : digiContrib < -0.05 ? "negative" : "neutral" });

  // Stability
  const annualIncome = c.monthlyIncome * 12;
  const stability = annualIncome > 0 ? (c.totalSavings + c.totalInvestments) / (annualIncome * 2) : 0;
  const stabContrib = (stability - 0.4) * 0.20;
  v += stabContrib;
  f.push({ name: "Liquid Stability", value: `${(stability * 100).toFixed(0)}%`, contribution: Math.round(stabContrib * 100) / 100, direction: stabContrib > 0.05 ? "positive" : stabContrib < -0.05 ? "negative" : "neutral" });

  const outcome: "Approve" | "Review" | "Decline" = v > 0.65 ? "Approve" : v > 0.40 ? "Review" : "Decline";
  return { outcome, baseValue: 0.45, features: f };
}

// ---- RAG Search (keyword-based mock retrieval) ----
export function ragSearch(query: string): {
  policy: typeof policies[number];
  score: number;
  snippet: string;
}[] {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(t => t.length > 2);
  const results: { policy: typeof policies[number]; score: number; snippet: string }[] = [];

  for (const p of policies) {
    let score = 0;
    const contentLower = p.content.toLowerCase();
    const titleLower = p.title.toLowerCase();
    const tagsLower = p.tags.join(" ").toLowerCase();
    for (const t of tokens) {
      if (titleLower.includes(t)) score += 5;
      if (tagsLower.includes(t)) score += 4;
      if (p.summary.toLowerCase().includes(t)) score += 3;
      if (contentLower.includes(t)) score += 1;
    }
    if (score > 0) {
      // Find a snippet around the first matching token
      let snippet = p.summary;
      for (const t of tokens) {
        const idx = contentLower.indexOf(t);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(p.content.length, idx + 180);
          snippet = "..." + p.content.slice(start, end) + "...";
          break;
        }
      }
      results.push({ policy: p, score, snippet });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ---- Next Best Action ----
export type NBA = {
  id: string;
  customerId: string;
  customerName: string;
  action: string;
  rationale: string;
  channel: "Call" | "Email" | "Branch Visit" | "In-App" | "WhatsApp";
  priority: "P0" | "P1" | "P2" | "P3";
  expectedUplift: string;
  deadline: string;
};

export function nextBestActions(list: Customer[] = customers): NBA[] {
  const out: NBA[] = [];
  for (const c of list) {
    const r = riskPredict(c);
    const hs = healthScore(c);

    // Risk-driven actions (highest priority)
    if (r.band === "High" || r.band === "Critical") {
      out.push({
        id: `NBA-${c.id}-RISK`,
        customerId: c.id,
        customerName: c.name,
        action: r.band === "Critical" ? "Initiate recovery action per POL-005" : "Schedule risk mitigation call & offer debt consolidation",
        rationale: `Risk probability ${(r.probability*100).toFixed(0)}% (${r.band}). Top driver: ${r.drivers[0]?.label ?? "multiple factors"}.`,
        channel: "Call",
        priority: r.band === "Critical" ? "P0" : "P1",
        expectedUplift: "Reduce PD by 15-25%",
        deadline: r.band === "Critical" ? "Today" : "Within 3 days",
      });
      continue;
    }

    // Cross-sell based on health score & segment
    if (hs.band === "Excellent" && c.segment === "Wealth") {
      out.push({
        id: `NBA-${c.id}-WEALTH`,
        customerId: c.id,
        customerName: c.name,
        action: "Pitch wealth management portfolio review & alternate investment products",
        rationale: `Health score ${hs.score} (Excellent), Wealth segment. Eligible for premium advisory per POL-004.`,
        channel: "Branch Visit",
        priority: "P1",
        expectedUplift: "AUM +INR 50-100 Lakh",
        deadline: "Within 2 weeks",
      });
      continue;
    }

    if (hs.band === "Good" && c.numProducts < 4 && c.monthlyIncome > 80000) {
      out.push({
        id: `NBA-${c.id}-CC`,
        customerId: c.id,
        customerName: c.name,
        action: "Offer pre-approved Premium Credit Card with complimentary lounge access",
        rationale: `Good health score ${hs.score}, low product diversification (${c.numProducts} products). Eligible per POL-007.`,
        channel: "WhatsApp",
        priority: "P2",
        expectedUplift: "Revenue +INR 8K ARR",
        deadline: "Within 1 month",
      });
      continue;
    }

    if (c.digitalEngagement < 0.4) {
      out.push({
        id: `NBA-${c.id}-DIGI`,
        customerId: c.id,
        customerName: c.name,
        action: "Send digital onboarding tutorial + UPI activation incentive",
        rationale: `Digital engagement ${(c.digitalEngagement*100).toFixed(0)}% - below 40% threshold. Reduces cost-to-serve by 60% if migrated.`,
        channel: "Email",
        priority: "P3",
        expectedUplift: "Engagement +15%",
        deadline: "Within 1 month",
        });
      continue;
    }

    if (c.age >= 58) {
      out.push({
        id: `NBA-${c.id}-SCSS`,
        customerId: c.id,
        customerName: c.name,
        action: "Offer Senior Citizen Savings Scheme (SCSS) at 8.2% p.a. + 0.5% FD booster",
        rationale: `Customer age ${c.age} eligible for senior citizen schemes per POL-008.`,
        channel: "Call",
        priority: "P2",
        expectedUplift: "Deposit +INR 5-15 Lakh",
        deadline: "Within 2 weeks",
      });
      continue;
    }

    // Default - portfolio review
    out.push({
      id: `NBA-${c.id}-REVIEW`,
      customerId: c.id,
      customerName: c.name,
      action: "Quarterly portfolio review call",
      rationale: `Routine review. Health score ${hs.score} (${hs.band}).`,
      channel: "Call",
      priority: "P3",
      expectedUplift: "Retention +5%",
      deadline: "Within 1 month",
    });
  }
  return out;
}

// ---- Scheme Matching ----
export function matchSchemes(c: Customer): {
  scheme: typeof schemes[number];
  matchScore: number;
  matchedCriteria: string[];
  missingCriteria: string[];
}[] {
  const results: { scheme: typeof schemes[number]; matchScore: number; matchedCriteria: string[]; missingCriteria: string[] }[] = [];

  for (const s of schemes) {
    let matched: string[] = [];
    let missing: string[] = [];
    let total = s.eligibility.length;

    // Simple heuristic matching based on customer profile
    if (s.id === "SCH-001" || s.id === "SCH-004") { // PMAY, PMJDY - housing
      if (c.monthlyIncome < 150000) matched.push("Income within eligible band");
      else missing.push("Income exceeds MIG-II ceiling");
    }
    if (s.id === "SCH-002" || s.id === "SCH-003") { // Mudra, Stand-Up
      if (c.segment === "Retail" && c.monthlyIncome < 200000) matched.push("Eligible for small business loan");
      else missing.push("Profile not aligned with MSME criteria");
    }
    if (s.id === "SCH-005") { // APY
      if (c.age >= 18 && c.age <= 40) matched.push("Age 18-40 eligible");
      else missing.push("Age outside 18-40 band");
      if (c.monthlyIncome < 50000) matched.push("Non-taxpayer category");
    }
    if (s.id === "SCH-006") { // SSY - assume child-related
      if (c.age >= 28 && c.age <= 45) matched.push("Likely parent of minor girl child");
      else missing.push("Age outside parent band");
    }
    if (s.id === "SCH-007") { // PM-KISAN
      missing.push("Requires landholding farmer status (verify via land records)");
    }
    if (s.id === "SCH-008") { // NSP - education
      if (c.age < 30) matched.push("Likely student or parent of student");
      else missing.push("Outside typical student age band");
    }

    if (matched.length === 0 && s.id !== "SCH-007") {
      // Generic match
      matched.push("Indian citizen with active bank account");
    }
    if (missing.length === 0) {
      matched.push("Aadhaar & KYC verified");
    }

    const matchScore = Math.round((matched.length / (matched.length + missing.length)) * 100);
    results.push({ scheme: s, matchScore, matchedCriteria: matched, missingCriteria: missing });
  }
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

// ---- Analytics Aggregations ----
export function analyticsSummary(
  custList: Customer[] = customers,
  leadList: Lead[] = leads,
  rmId: string | null = null,
) {
  const totalCustomers = custList.length;
  const denom = totalCustomers || 1; // avoid divide-by-zero for an empty book
  const totalAUM = custList.reduce((s, c) => s + c.totalSavings + c.totalInvestments, 0);
  const avgHealth = Math.round(custList.reduce((s, c) => s + healthScore(c).score, 0) / denom);
  const highRisk = custList.filter(c => ["High", "Critical"].includes(riskPredict(c).band)).length;
  const segmentDist = segmentsMap(custList);
  const stageDist = leadStageDist(leadList);
  return {
    totalAUM,
    totalCustomers,
    avgHealth,
    highRiskCount: highRisk,
    riskRate: highRisk / denom,
    segmentDist,
    stageDist,
    // RMs see only their own row; elevated roles see the full leaderboard.
    topRMs: (rmId ? rms.filter(r => r.id === rmId) : rms.slice()).sort((a, b) => b.bookSize - a.bookSize),
  };
}

function segmentsMap(list: Customer[] = customers) {
  const map: Record<string, number> = {};
  for (const c of list) map[c.segment] = (map[c.segment] || 0) + 1;
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function leadStageDist(list: Lead[] = leads) {
  const map: Record<string, number> = {};
  for (const l of list) map[l.stage] = (map[l.stage] || 0) + 1;
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

// ---- Helper exports ----
export { customers, policies, schemes, loanProducts };
