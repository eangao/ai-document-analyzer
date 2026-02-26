"use client";

import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RiskFlags } from "@/components/dashboard/RiskFlags";
import { EntitiesAndDates } from "@/components/dashboard/EntitiesAndDates";
import { FinancialItems } from "@/components/dashboard/FinancialItems";
import { ObligationsTable } from "@/components/dashboard/ObligationsTable";
import { KeyTerms } from "@/components/dashboard/KeyTerms";
import { ActionItems } from "@/components/dashboard/ActionItems";
import type { DocumentAnalysis } from "@/types";

interface AnalysisDashboardProps {
  readonly data: DocumentAnalysis | null;
}

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No analysis available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SummaryCard
        documentType={data.documentType}
        summary={data.summary}
      />
      <RiskFlags risks={data.riskFlags} />
      <EntitiesAndDates
        entities={data.keyEntities}
        dates={data.keyDates}
      />
      <FinancialItems items={data.financialItems} />
      <ObligationsTable obligations={data.obligations} />
      <KeyTerms terms={data.keyTerms} />
      <ActionItems items={data.actionItems} />
    </div>
  );
}
