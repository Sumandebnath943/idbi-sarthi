// Synthetic Banking Dataset for AI Relationship Manager Copilot
// Deterministic, generated once and reused across API routes.

export type Customer = {
  id: string;
  name: string;
  age: number;
  email: string;
  phone: string;
  city: string;
  segment: "Retail" | "Priority" | "Wealth" | "NRI";
  kycStatus: "Verified" | "Pending" | "Review";
  onboardingDate: string; // ISO date
  rmId: string;
  // financial snapshot
  monthlyIncome: number;
  monthlyExpense: number;
  totalSavings: number;
  totalInvestments: number;
  outstandingDebt: number;
  creditUtilization: number; // 0..1
  creditLimit: number;
  emiBurden: number; // 0..1
  numProducts: number;
  numTransactions30d: number;
  digitalEngagement: number; // 0..1
  npaFlag: boolean;
  // relationships
  accounts: Account[];
  transactions: Transaction[];
  riskFactors: { label: string; weight: number }[];
};

export type Account = {
  id: string;
  type: "Savings" | "Current" | "FD" | "Credit Card" | "Loan" | "Demat";
  balance: number;
  openedOn: string;
  currency: "INR";
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number; // negative = debit
  category: "Salary" | "Shopping" | "Bills" | "Food" | "Investment" | "EMI" | "Transfer" | "Other";
};

export type Lead = {
  id: string;
  name: string;
  source: "Walk-in" | "Web Lead" | "Referral" | "Campaign" | "Cold Call";
  product: "Home Loan" | "Personal Loan" | "Credit Card" | "Wealth Mgmt" | "Insurance";
  estimatedValue: number;
  score: number; // 0..100
  stage: "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  assignedRm: string;
  lastContact: string;
};

export type Policy = {
  id: string;
  title: string;
  category: "Lending" | "Compliance" | "Risk" | "Customer Service" | "Wealth Mgmt";
  summary: string;
  content: string;
  tags: string[];
  version: string;
  effectiveDate: string;
};

export type Scheme = {
  id: string;
  name: string;
  ministry: string;
  category: "Housing" | "MSME" | "Agriculture" | "Education" | "Women" | "Senior Citizen";
  eligibility: string[];
  benefits: string;
  maxSubsidy: number;
};

export type LoanProduct = {
  id: string;
  name: string;
  type: "Home Loan" | "Personal Loan" | "Auto Loan" | "Education Loan" | "Business Loan";
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseRate: number; // annual %
  eligibility: { minIncome: number; minCibil: number; maxEmiBurden: number };
  highlights: string[];
};

export type RM = {
  id: string;
  name: string;
  role: string;
  branch: string;
  bookSize: number;
  customersManaged: number;
  nps: number;
};

// ---- Helpers ----
const pick = <T,>(arr: T[], i: number): T => arr[i % arr.length];

const firstNames = ["Arjun","Priya","Rahul","Sneha","Vikram","Ananya","Karthik","Divya","Aditya","Meera","Rohan","Pooja","Sanjay","Kavya","Nikhil","Isha","Vivek","Neha","Amit","Shreya","Manish","Aishwarya","Rajesh","Lakshmi"];
const lastNames = ["Sharma","Iyer","Reddy","Nair","Patel","Mehta","Gupta","Rao","Kapoor","Singh","Joshi","Desai","Bhat","Menon","Verma","Chopra"];
const cities = ["Mumbai","Bengaluru","Delhi","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Kochi"];
const segments: Customer["segment"][] = ["Retail","Priority","Wealth","NRI"];

const now = new Date("2025-06-15T00:00:00Z");

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
function rng(seed: string) {
  let s = hash(seed);
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---- Generate Customers ----
function genCustomers(): Customer[] {
  const out: Customer[] = [];
  for (let i = 0; i < 24; i++) {
    const id = `CUST-${String(1001 + i)}`;
    const r = rng(id);
    const name = `${pick(firstNames, i)} ${pick(lastNames, i * 3 + 1)}`;
    const age = 25 + Math.floor(r() * 40);
    const segment = pick(segments, i + Math.floor(r() * 4));
    const monthlyIncome = segment === "Wealth" ? 400000 + Math.floor(r() * 800000)
                       : segment === "Priority" ? 150000 + Math.floor(r() * 250000)
                       : segment === "NRI" ? 300000 + Math.floor(r() * 500000)
                       : 35000 + Math.floor(r() * 110000);
    const monthlyExpense = Math.floor(monthlyIncome * (0.4 + r() * 0.4));
    const totalSavings = Math.floor(monthlyIncome * (3 + r() * 18));
    const totalInvestments = segment === "Wealth" || segment === "NRI"
      ? Math.floor(monthlyIncome * (8 + r() * 30))
      : Math.floor(monthlyIncome * (1 + r() * 6));
    const creditLimit = Math.floor(monthlyIncome * (2 + r() * 6));
    const outstandingDebt = Math.floor(creditLimit * (r() * 0.7));
    const creditUtilization = creditLimit > 0 ? outstandingDebt / creditLimit : 0;
    const emiBurden = Math.min(0.85, r() * 0.6);
    const numProducts = 2 + Math.floor(r() * 7);
    const numTransactions30d = 8 + Math.floor(r() * 90);
    const digitalEngagement = r();
    const npaFlag = r() < 0.08;
    const rmId = `RM-${String(201 + (i % 4))}`;

    // accounts
    const accounts: Account[] = [
      { id: `ACC-${id}-SAV`, type: "Savings", balance: totalSavings, openedOn: "2018-04-12", currency: "INR" },
      { id: `ACC-${id}-DEM`, type: "Demat", balance: totalInvestments, openedOn: "2019-08-01", currency: "INR" },
    ];
    if (segment !== "Retail") accounts.push({ id: `ACC-${id}-CC`, type: "Credit Card", balance: outstandingDebt, openedOn: "2020-03-15", currency: "INR" });
    if (emiBurden > 0.3) accounts.push({ id: `ACC-${id}-LOAN`, type: "Loan", balance: Math.floor(monthlyIncome * 12 * emiBurden * 2), openedOn: "2022-06-20", currency: "INR" });
    if (segment === "Wealth") accounts.push({ id: `ACC-${id}-FD`, type: "FD", balance: Math.floor(totalSavings * 0.5), openedOn: "2021-11-05", currency: "INR" });

    // transactions (last 6)
    const txCats: Transaction["category"][] = ["Salary","Shopping","Bills","Food","Investment","EMI","Transfer","Other"];
    const transactions: Transaction[] = [];
    for (let t = 0; t < 8; t++) {
      const cat = pick(txCats, t + i);
      const isCredit = cat === "Salary" || (cat === "Transfer" && r() > 0.5);
      const amount = cat === "Salary" ? monthlyIncome
                   : isCredit ? Math.floor(r() * 20000)
                   : -Math.floor(r() * 15000 + 500);
      transactions.push({
        id: `TX-${id}-${t}`,
        date: new Date(now.getTime() - t * 86400000 * 3).toISOString().slice(0,10),
        description: cat === "Salary" ? "Salary Credit - Acme Corp" : cat === "EMI" ? "EMI Debit - Loan #1234" : cat === "Shopping" ? "Amazon Purchase" : cat === "Food" ? "Swiggy Order" : cat === "Bills" ? "Electricity Bill Payment" : cat === "Investment" ? "MF SIP - Axis Bluechip" : cat === "Transfer" ? "UPI Transfer" : "Misc Debit",
        amount,
        category: cat,
      });
    }

    // risk factors
    const riskFactors: { label: string; weight: number }[] = [];
    if (creditUtilization > 0.5) riskFactors.push({ label: "High Credit Utilization", weight: Math.min(0.4, creditUtilization) });
    if (emiBurden > 0.4) riskFactors.push({ label: "EMI Burden > 40%", weight: Math.min(0.3, emiBurden) });
    if (digitalEngagement < 0.3) riskFactors.push({ label: "Low Digital Engagement", weight: 0.15 });
    if (numTransactions30d < 15) riskFactors.push({ label: "Low Activity", weight: 0.1 });
    if (npaFlag) riskFactors.push({ label: "NPA Flag", weight: 0.6 });
    if (monthlyExpense / monthlyIncome > 0.7) riskFactors.push({ label: "High Expense Ratio", weight: 0.2 });

    out.push({
      id, name, age,
      email: `${name.toLowerCase().replace(" ", ".")}@email.com`,
      phone: `+91 9${String(800000000 + i * 1234567).slice(0,9)}`,
      city: pick(cities, i + Math.floor(r() * 10)),
      segment,
      kycStatus: r() > 0.85 ? "Pending" : r() > 0.95 ? "Review" : "Verified",
      onboardingDate: `20${17 + (i % 7)}-0${1 + (i % 9)}-1${i % 9}`,
      rmId,
      monthlyIncome, monthlyExpense, totalSavings, totalInvestments,
      outstandingDebt, creditUtilization, creditLimit, emiBurden,
      numProducts, numTransactions30d, digitalEngagement, npaFlag,
      accounts, transactions, riskFactors,
    });
  }
  return out;
}

export const customers: Customer[] = genCustomers();

// ---- Leads ----
const leadStages: Lead["stage"][] = ["New","Qualified","Proposal","Negotiation","Won","Lost"];
const leadSources: Lead["source"][] = ["Walk-in","Web Lead","Referral","Campaign","Cold Call"];
const leadProducts: Lead["product"][] = ["Home Loan","Personal Loan","Credit Card","Wealth Mgmt","Insurance"];
const leadNames = ["Ritu Bansal","Sandeep Kulkarni","Anjali Saxena","Mohit Aggarwal","Fatima Sheikh","Gaurav Pandey","Tara Joseph","Imran Khan","Ritu Menon","Suresh Kamath","Deepa Iyengar","Vinod Nambiar","Ankit Tripathi","Reshma Pillai","Yash Malhotra","Karishma Shah"];

export const leads: Lead[] = leadNames.map((name, i) => {
  const r = rng(`lead-${i}`);
  const stage = pick(leadStages, i + Math.floor(r() * 6));
  const product = pick(leadProducts, i);
  const estimatedValue = product === "Home Loan" ? 5000000 + Math.floor(r() * 15000000)
                       : product === "Wealth Mgmt" ? 1000000 + Math.floor(r() * 10000000)
                       : 100000 + Math.floor(r() * 900000);
  const score = Math.min(99, Math.max(15, 30 + Math.floor(r() * 70)));
  return {
    id: `LEAD-${5001 + i}`,
    name,
    source: pick(leadSources, i),
    product,
    estimatedValue,
    score,
    stage,
    assignedRm: `RM-${201 + (i % 4)}`,
    lastContact: new Date(now.getTime() - i * 86400000).toISOString().slice(0,10),
  };
});

// ---- Policies (for RAG) ----
export const policies: Policy[] = [
  {
    id: "POL-001",
    title: "Home Loan Eligibility & Documentation",
    category: "Lending",
    summary: "Documents and criteria for processing home loan applications up to INR 5 Cr.",
    content: `Home Loan eligibility is determined by age (21-65 years), monthly net income (minimum INR 25,000), CIBIL score (minimum 750), and FOIR (Fixed Obligation to Income Ratio) not exceeding 50%. Required documents include identity proof (Aadhaar/PAN), address proof, last 3 months salary slips, last 2 years Form 16, and 6 months bank statements. For self-employed applicants, ITR for last 3 years and business proof are mandatory. Maximum LTV is 90% for loans up to INR 30 Lakh, 80% for 30-75 Lakh, and 75% above 75 Lakh. Processing fee is 0.5% of loan amount, non-refundable. Rate type: floating linked to repo rate. Current effective rate: 8.4%-9.1% p.a.`,
    tags: ["home loan","eligibility","cibil","foir","ltv","documentation"],
    version: "v3.2",
    effectiveDate: "2025-04-01",
  },
  {
    id: "POL-002",
    title: "Personal Loan Risk Assessment Matrix",
    category: "Risk",
    summary: "Risk scoring framework for unsecured personal loans.",
    content: `Personal loans are unsecured and require enhanced risk assessment. Score combines (a) credit history 35%, (b) income stability 25%, (c) existing debt burden 20%, (d) employment tenure 10%, (e) banking relationship 10%. Auto-decline if CIBIL < 700, FOIR > 60%, or any default in last 24 months. Above 750 CIBIL with FOIR < 40% qualifies for preferential rate. Maximum tenure 60 months. Maximum amount 25x monthly net income. Mandatory deductions: processing fee 2-2.5%, pre-closure charge 4-5% within 12 months.`,
    tags: ["personal loan","risk","cibil","foir","unsecured"],
    version: "v2.1",
    effectiveDate: "2025-02-15",
  },
  {
    id: "POL-003",
    title: "AML & KYC Compliance Guidelines",
    category: "Compliance",
    summary: "Anti-money laundering and KYC procedures for customer onboarding.",
    content: `All customers must complete CKYC before account activation. Officially Valid Documents (OVD) include Aadhaar, Passport, Voter ID, Driving License, NREGA Job Card. PAN is mandatory for all accounts except no-frills. For transactions above INR 10 Lakh cash, CTR must be filed within 7 days. Suspicious transactions require STR filing to FIU-IND within 7 days of detection. PEP (Politically Exposed Person) screening mandatory. Enhanced Due Diligence for high-risk customers including source of funds verification. Periodic KYC review: low risk 10 years, medium 8 years, high 2 years.`,
    tags: ["aml","kyc","compliance","ckyc","pep","fiu"],
    version: "v4.0",
    effectiveDate: "2025-01-01",
  },
  {
    id: "POL-004",
    title: "Wealth Management Advisory Framework",
    category: "Wealth Mgmt",
    summary: "Suitability-based advisory for HNI and Wealth segment customers.",
    content: `Wealth management advisory follows suitability principle based on risk profiling (Conservative, Moderate, Aggressive). Mandatory KYA (Know Your Customer) for investment products. Minimum ticket size for Wealth segment: INR 25 Lakh. Asset allocation must align with customer's stated risk profile. Tax-saving instruments (ELSS, PPF, NPS) capped at 80C limit (INR 1.5 Lakh). SIP recommendations must not exceed 30% of net monthly income. Direct equity exposure capped at 15% for Conservative, 35% for Moderate, 60% for Aggressive profiles. Quarterly portfolio review mandatory for AUM > INR 1 Cr.`,
    tags: ["wealth","advisory","mutual funds","sip","portfolio","risk profile"],
    version: "v2.5",
    effectiveDate: "2025-03-01",
  },
  {
    id: "POL-005",
    title: "NPA Recognition & Recovery Procedure",
    category: "Risk",
    summary: "Non-performing asset classification and recovery actions.",
    content: `NPA classification as per RBI: Sub-standard (NPA up to 12 months), Doubtful (12-36 months), Loss (>36 months or unrecoverable). Special Mention Account (SMA) tracking: SMA-0 (1-30 days overdue), SMA-1 (31-60 days), SMA-2 (61-90 days). Recovery actions: personal contact at 30 days, formal notice at 60 days, legal notice at 90 days, SARFAESI proceedings at 180 days. Restructuring allowed once per loan with 6-month moratorium max. Provisioning norms: Standard 0.4%, Sub-standard 15%, Doubtful 25-40%, Loss 100%. Write-off requires board approval.`,
    tags: ["npa","recovery","sma","sarfaesi","provisioning","rbi"],
    version: "v3.0",
    effectiveDate: "2024-12-15",
  },
  {
    id: "POL-006",
    title: "Digital Banking & UPI Fraud Prevention",
    category: "Customer Service",
    summary: "Customer protection framework for digital transaction fraud.",
    content: `Customers must report unauthorised digital transactions within 3 working days for zero liability. Bank liability capped at INR 25,000 if reported 4-7 days, INR 10,000 beyond 7 days for accounts with balance up to INR 5 Lakh. Mandatory 2FA for transactions above INR 5,000. Cooling period of 24 hours for first-time beneficiary addition above INR 1 Lakh. Suspicious IP/geo-patterns trigger auto-block. Phishing attempts must be reported to report.phishing@bank.co.in. Customer awareness SMS every quarter. Chargeback process TAT: 90 days resolution.`,
    tags: ["digital","upi","fraud","security","complaint"],
    version: "v2.8",
    effectiveDate: "2025-05-01",
  },
  {
    id: "POL-007",
    title: "Credit Card Issuance & Limit Enhancement",
    category: "Lending",
    summary: "Credit card approval workflow and credit limit review.",
    content: `Credit card issuance requires CIBIL >= 700, minimum income INR 25,000/month, age 21-60. Initial credit limit: 2-3x monthly income for entry cards, 4-6x for premium, 8-10x for super-premium. Limit enhancement review every 12 months based on usage (>40%), repayment history, and income growth. Annual fee waiver on spends above INR 3 Lakh for premium cards. Cash withdrawal limit 30% of total credit limit. Interest-free period 18-55 days. Late payment charges: INR 100-1300 based on outstanding. Over-limit fee INR 500 per instance.`,
    tags: ["credit card","limit","cibil","issuance"],
    version: "v2.3",
    effectiveDate: "2025-04-15",
  },
  {
    id: "POL-008",
    title: "Senior Citizen Deposit Schemes",
    category: "Wealth Mgmt",
    summary: "Special deposit products for customers aged 60 and above.",
    content: `Senior Citizen Fixed Deposit offers additional 0.5% over card rate. Minimum deposit INR 1,000, maximum INR 1 Crore (single holder) or INR 2 Crore (joint). Tenure 7 days to 10 years. Monthly/quarterly interest payout option available. SCSS (Senior Citizen Savings Scheme) offers 8.2% p.a., tenure 5 years, max INR 30 Lakh. Premature withdrawal penalty: 1-2 years (-1.5%), >2 years (-1%). TDS deducted if interest exceeds INR 50,000/year (Form 15H for exemption). Doorstep banking available for customers above 70.`,
    tags: ["senior citizen","fd","scss","deposit","retirement"],
    version: "v1.8",
    effectiveDate: "2025-01-15",
  },
];

// ---- Government Schemes ----
export const schemes: Scheme[] = [
  {
    id: "SCH-001",
    name: "Pradhan Mantri Awas Yojana (PMAY)",
    ministry: "Ministry of Housing & Urban Affairs",
    category: "Housing",
    eligibility: ["Annual income up to INR 18 Lakh (MIG-II)","First-time home buyer","No pucca house in family","Aadhaar mandatory"],
    benefits: "Interest subsidy up to 6.5% on home loan principal up to INR 6 Lakh",
    maxSubsidy: 2300000,
  },
  {
    id: "SCH-002",
    name: "PM Mudra Yojana (PMMY)",
    ministry: "Ministry of Finance",
    category: "MSME",
    eligibility: ["Non-corporate small business","Loan up to INR 10 Lakh","Engaged in income generating activity","Indian citizen"],
    benefits: "Collateral-free loan up to INR 10 Lakh under Shishu/Kishore/Tarun categories",
    maxSubsidy: 1000000,
  },
  {
    id: "SCH-003",
    name: "Stand-Up India",
    ministry: "Ministry of Finance",
    category: "MSME",
    eligibility: ["SC/ST or Women entrepreneur","First-time borrower","Greenfield enterprise","Loan INR 10 Lakh to 1 Cr"],
    benefits: "Bank loan between INR 10 Lakh and 1 Cr for setting up greenfield enterprise",
    maxSubsidy: 10000000,
  },
  {
    id: "SCH-004",
    name: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
    ministry: "Ministry of Finance",
    category: "Housing",
    eligibility: ["Indian citizen above 10 years","No existing bank account","Voluntary consent"],
    benefits: "Zero-balance account with RuPay debit card, accident insurance INR 2 Lakh, overdraft up to INR 10,000",
    maxSubsidy: 10000,
  },
  {
    id: "SCH-005",
    name: "Atal Pension Yojana (APY)",
    ministry: "Ministry of Finance",
    category: "Senior Citizen",
    eligibility: ["Age 18-40 years","Indian citizen","Bank account holder","Not income tax payer"],
    benefits: "Guaranteed monthly pension INR 1,000-5,000 after age 60; Government co-contribution 50% of total contribution or INR 1,000/year (whichever is lower)",
    maxSubsidy: 1000,
  },
  {
    id: "SCH-006",
    name: "Sukanya Samriddhi Yojana (SSY)",
    ministry: "Ministry of Finance",
    category: "Women",
    eligibility: ["Girl child below 10 years","Indian citizen","One account per girl child (max 2 per family)","Parent/legal guardian operates"],
    benefits: "Tax-free 8.2% p.a. interest; tax deduction under 80C; maturity after 21 years or on marriage after 18",
    maxSubsidy: 150000,
  },
  {
    id: "SCH-007",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    ministry: "Ministry of Agriculture",
    category: "Agriculture",
    eligibility: ["Landholding farmer family","Indian citizen","Annual family income < INR 2 Lakh (excluded categories)"],
    benefits: "INR 6,000 per year in three equal installments directly to bank account",
    maxSubsidy: 6000,
  },
  {
    id: "SCH-008",
    name: "National Scholarship Portal (NSP)",
    ministry: "Ministry of Education",
    category: "Education",
    eligibility: ["Student from SC/ST/OBC/Minority","Family income below INR 1-2.5 Lakh","Minimum 50-60% marks","Indian citizen"],
    benefits: "Scholarship INR 12,000-20,000 per annum for pre-matric, post-matric, merit-cum-means scholarships",
    maxSubsidy: 20000,
  },
];

// ---- Loan Products ----
export const loanProducts: LoanProduct[] = [
  {
    id: "LN-HL-01",
    name: "Premium Home Loan",
    type: "Home Loan",
    minAmount: 500000,
    maxAmount: 50000000,
    minTenureMonths: 60,
    maxTenureMonths: 360,
    baseRate: 8.4,
    eligibility: { minIncome: 40000, minCibil: 750, maxEmiBurden: 0.5 },
    highlights: ["Repo-linked rate","No prepayment charges","Doorstep documentation","Free property valuation"],
  },
  {
    id: "LN-PL-01",
    name: "Express Personal Loan",
    type: "Personal Loan",
    minAmount: 50000,
    maxAmount: 2500000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    baseRate: 11.5,
    eligibility: { minIncome: 25000, minCibil: 700, maxEmiBurden: 0.6 },
    highlights: ["Disbursal in 24 hours","Minimal documentation","Pre-approved for existing customers","Flexible tenure"],
  },
  {
    id: "LN-AL-01",
    name: "Auto Loan - New Car",
    type: "Auto Loan",
    minAmount: 100000,
    maxAmount: 10000000,
    minTenureMonths: 12,
    maxTenureMonths: 96,
    baseRate: 9.2,
    eligibility: { minIncome: 30000, minCibil: 720, maxEmiBurden: 0.55 },
    highlights: ["Up to 90% on-road funding","Quick approval","Attractive rates for EVs","Pre-owned car option"],
  },
  {
    id: "LN-EL-01",
    name: "Education Loan - Premier",
    type: "Education Loan",
    minAmount: 100000,
    maxAmount: 40000000,
    minTenureMonths: 60,
    maxTenureMonths: 180,
    baseRate: 9.5,
    eligibility: { minIncome: 25000, minCibil: 700, maxEmiBurden: 0.5 },
    highlights: ["Moratorium during study + 1 year","No collateral up to INR 7.5 Lakh","Special rate for IIT/IIM/ISB","Parent as co-applicant"],
  },
  {
    id: "LN-BL-01",
    name: "MSME Business Loan",
    type: "Business Loan",
    minAmount: 500000,
    maxAmount: 100000000,
    minTenureMonths: 12,
    maxTenureMonths: 120,
    baseRate: 10.8,
    eligibility: { minIncome: 50000, minCibil: 700, maxEmiBurden: 0.55 },
    highlights: ["CGTMSE coverage up to INR 5 Cr","Working capital limit","Quick digital onboarding","Sector-specific schemes"],
  },
];

// ---- RM Profiles ----
export const rms: RM[] = [
  { id: "RM-201", name: "Anjali Mehta", role: "Senior Relationship Manager", branch: "Bandra West, Mumbai", bookSize: 245000000, customersManaged: 142, nps: 78 },
  { id: "RM-202", name: "Rohit Sharma", role: "Relationship Manager", branch: "Koramangala, Bengaluru", bookSize: 178000000, customersManaged: 98, nps: 72 },
  { id: "RM-203", name: "Sneha Reddy", role: "Wealth Manager", branch: "Banjara Hills, Hyderabad", bookSize: 412000000, customersManaged: 76, nps: 84 },
  { id: "RM-204", name: "Vikram Singh", role: "Priority Banker", branch: "Connaught Place, Delhi", bookSize: 198000000, customersManaged: 110, nps: 75 },
];

// ---- Convenience getters ----
export function getCustomer(id: string): Customer | undefined {
  return customers.find(c => c.id === id);
}

export function getRM(id: string): RM | undefined {
  return rms.find(r => r.id === id);
}
