"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar, MobileNav } from "@/components/shell/topbar";
import { Footer } from "@/components/shell/footer";
import type { ModuleKey } from "@/lib/modules";

import { CustomerDashboard } from "@/components/modules/customer-dashboard";
import { HealthScore } from "@/components/modules/health-score";
import { LeadQualification } from "@/components/modules/lead-qualification";
import { LoanRecommendation } from "@/components/modules/loan-recommendation";
import { RiskPrediction } from "@/components/modules/risk-prediction";
import { ExplainableAI } from "@/components/modules/explainable-ai";
import { RagKnowledgeBase } from "@/components/modules/rag-knowledge-base";
import { RmChat } from "@/components/modules/rm-chat";
import { NextBestAction } from "@/components/modules/next-best-action";
import { SchemeMatcher } from "@/components/modules/scheme-matcher";
import { DocumentIntelligence } from "@/components/modules/document-intelligence";
import { AnalyticsDashboard } from "@/components/modules/analytics-dashboard";

export default function AppPage() {
  const [active, setActive] = useState<ModuleKey>("dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar active={active} onSelect={setActive} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar active={active} onSelect={setActive} />
          <main className="flex-1 px-4 lg:px-6 pt-6 pb-24 lg:pb-6 grid-bg overflow-y-auto">
            {active === "dashboard" && <CustomerDashboard />}
            {active === "health" && <HealthScore />}
            {active === "leads" && <LeadQualification />}
            {active === "loans" && <LoanRecommendation />}
            {active === "risk" && <RiskPrediction />}
            {active === "explain" && <ExplainableAI />}
            {active === "rag" && <RagKnowledgeBase />}
            {active === "chat" && <RmChat />}
            {active === "nba" && <NextBestAction />}
            {active === "schemes" && <SchemeMatcher />}
            {active === "documents" && <DocumentIntelligence />}
            {active === "analytics" && <AnalyticsDashboard />}
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav active={active} onSelect={setActive} />
    </div>
  );
}
