import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, HeartPulse, UserCheck, Banknote, ShieldAlert, Brain,
  BookOpen, MessageSquare, Target, Landmark, FileText, BarChart3,
} from "lucide-react";

export type ModuleKey =
  | "dashboard" | "health" | "leads" | "loans" | "risk" | "explain"
  | "rag" | "chat" | "nba" | "schemes" | "documents" | "analytics";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  short: string;
  desc: string;
  icon: LucideIcon;
  group: "Customer" | "Decisioning" | "Assistant" | "Operations";
};

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Customer 360 Dashboard", short: "Customer 360", desc: "Unified customer profile, accounts, transactions, signals", icon: LayoutDashboard, group: "Customer" },
  { key: "health", label: "Financial Health Score", short: "Health Score", desc: "Weighted 0-900 score with 6-factor breakdown", icon: HeartPulse, group: "Customer" },
  { key: "leads", label: "Lead Qualification", short: "Leads", desc: "ML-style scoring + Kanban pipeline", icon: UserCheck, group: "Customer" },
  { key: "loans", label: "Loan Recommendation", short: "Loans", desc: "Product matcher with rate & EMI estimation", icon: Banknote, group: "Decisioning" },
  { key: "risk", label: "Risk Prediction", short: "Risk", desc: "12-month default probability + SMA staging", icon: ShieldAlert, group: "Decisioning" },
  { key: "explain", label: "Explainable AI", short: "Explain AI", desc: "SHAP-style feature attribution", icon: Brain, group: "Decisioning" },
  { key: "rag", label: "RAG Knowledge Base", short: "RAG", desc: "Hybrid retrieval + grounded, cited answers", icon: BookOpen, group: "Assistant" },
  { key: "chat", label: "Relationship Manager Chat", short: "RM Chat", desc: "LLM copilot with customer context", icon: MessageSquare, group: "Assistant" },
  { key: "nba", label: "Next Best Action", short: "NBA", desc: "Prioritized proactive recommendations", icon: Target, group: "Assistant" },
  { key: "schemes", label: "Government Scheme Matcher", short: "Schemes", desc: "Eligibility match for 8 govt schemes", icon: Landmark, group: "Operations" },
  { key: "documents", label: "Document Intelligence", short: "Documents", desc: "OCR, extraction, KYC validation & verification", icon: FileText, group: "Operations" },
  { key: "analytics", label: "Analytics Dashboard", short: "Analytics", desc: "Portfolio-wide KPIs & distributions", icon: BarChart3, group: "Operations" },
];

export const MODULE_GROUPS = ["Customer", "Decisioning", "Assistant", "Operations"] as const;
