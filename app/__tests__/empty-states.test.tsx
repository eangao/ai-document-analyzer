import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { EntitiesAndDates } from "@/components/dashboard/EntitiesAndDates";
import { RiskFlags } from "@/components/dashboard/RiskFlags";
import { FinancialItems } from "@/components/dashboard/FinancialItems";
import { ObligationsTable } from "@/components/dashboard/ObligationsTable";
import { KeyTerms } from "@/components/dashboard/KeyTerms";
import { ActionItems } from "@/components/dashboard/ActionItems";
import type { DocumentAnalysis } from "@/types";

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe("Phase 3.4: Empty States & Error Messages", () => {
  describe("Individual Component Empty States", () => {
    it("EntitiesAndDates should show 'No entities found' when entities are empty", () => {
      renderWithTooltip(<EntitiesAndDates entities={[]} dates={[]} />);
      expect(screen.getByText(/no entities found/i)).toBeInTheDocument();
    });

    it("EntitiesAndDates should show 'No key dates found' when dates are empty", () => {
      renderWithTooltip(<EntitiesAndDates entities={[]} dates={[]} />);
      expect(screen.getByText(/no key dates found/i)).toBeInTheDocument();
    });

    it("RiskFlags should show 'No risk flags identified' when risks are empty", () => {
      renderWithTooltip(<RiskFlags risks={[]} />);
      expect(screen.getByText(/no risk flags identified/i)).toBeInTheDocument();
    });

    it("FinancialItems should show 'No financial items' when items are empty", () => {
      renderWithTooltip(<FinancialItems items={[]} />);
      expect(screen.getByText(/no financial items/i)).toBeInTheDocument();
    });

    it("ObligationsTable should show 'No obligations' when obligations are empty", () => {
      renderWithTooltip(<ObligationsTable obligations={[]} />);
      expect(screen.getByText(/no obligations/i)).toBeInTheDocument();
    });

    it("KeyTerms should show 'No key terms found' when terms are empty", () => {
      renderWithTooltip(<KeyTerms terms={[]} />);
      expect(screen.getByText(/no key terms found/i)).toBeInTheDocument();
    });

    it("ActionItems should show 'No action items' when items are empty", () => {
      renderWithTooltip(<ActionItems items={[]} />);
      expect(screen.getByText(/no action items/i)).toBeInTheDocument();
    });
  });

  describe("Full Dashboard Empty States", () => {
    it("should handle document with all empty arrays gracefully", () => {
      const sparseAnalysis: DocumentAnalysis = {
        summary: "Simple one-page letter with minimal content",
        documentType: "letter",
        keyEntities: [],
        keyDates: [],
        financialItems: [],
        obligations: [],
        riskFlags: [],
        keyTerms: [],
        actionItems: [],
      };

      renderWithTooltip(<AnalysisDashboard data={sparseAnalysis} />);

      // Summary and document type should always display
      expect(screen.getByText("Summary")).toBeInTheDocument();
      expect(
        screen.getByText("Simple one-page letter with minimal content")
      ).toBeInTheDocument();
      expect(screen.getByText("letter")).toBeInTheDocument();

      // All empty state messages should be present
      expect(screen.getByText(/no entities found/i)).toBeInTheDocument();
      expect(screen.getByText(/no key dates found/i)).toBeInTheDocument();
      expect(screen.getByText(/no risk flags identified/i)).toBeInTheDocument();
      expect(screen.getByText(/no financial items/i)).toBeInTheDocument();
      expect(screen.getByText(/no obligations/i)).toBeInTheDocument();
      expect(screen.getByText(/no key terms found/i)).toBeInTheDocument();
      expect(screen.getByText(/no action items/i)).toBeInTheDocument();
    });

    it("should not render orphaned section headers for empty sections", () => {
      const sparseAnalysis: DocumentAnalysis = {
        summary: "Test document",
        documentType: "report",
        keyEntities: [],
        keyDates: [],
        financialItems: [],
        obligations: [],
        riskFlags: [],
        keyTerms: [],
        actionItems: [],
      };

      const { container } = renderWithTooltip(
        <AnalysisDashboard data={sparseAnalysis} />
      );

      // All section titles should still be present (they're part of the cards)
      // but they should show appropriate empty state messages
      expect(screen.getByText("Entities")).toBeInTheDocument();
      expect(screen.getByText("Risk Flags")).toBeInTheDocument();
      expect(screen.getByText("Financial Items")).toBeInTheDocument();
      expect(screen.getByText("Obligations")).toBeInTheDocument();
      expect(screen.getByText("Key Terms")).toBeInTheDocument();
      expect(screen.getByText("Action Items")).toBeInTheDocument();
    });

    it("should handle partial data without breaking layout", () => {
      const partialAnalysis: DocumentAnalysis = {
        summary: "Contract with limited details",
        documentType: "contract",
        keyEntities: [
          {
            name: "Company A",
            type: "organization",
            confidence: 0.9,
            context: "Party",
          },
        ],
        keyDates: [], // Empty
        financialItems: [
          {
            description: "Payment",
            amount: 1000,
            currency: "USD",
            category: "payment",
          },
        ],
        obligations: [], // Empty
        riskFlags: [
          {
            title: "Review needed",
            description: "Check terms",
            severity: "low",
          },
        ],
        keyTerms: [], // Empty
        actionItems: [], // Empty
      };

      renderWithTooltip(<AnalysisDashboard data={partialAnalysis} />);

      // Populated sections show data
      expect(screen.getByText("Company A")).toBeInTheDocument();
      expect(screen.getByText("Payment")).toBeInTheDocument();
      expect(screen.getByText("Review needed")).toBeInTheDocument();

      // Empty sections show appropriate messages
      expect(screen.getByText(/no key dates found/i)).toBeInTheDocument();
      expect(screen.getByText(/no obligations/i)).toBeInTheDocument();
      expect(screen.getByText(/no key terms found/i)).toBeInTheDocument();
      expect(screen.getByText(/no action items/i)).toBeInTheDocument();
    });
  });

  describe("Null/Undefined Data Handling", () => {
    it("AnalysisDashboard should handle null data gracefully", () => {
      renderWithTooltip(<AnalysisDashboard data={null} />);
      expect(screen.getByText(/no analysis available/i)).toBeInTheDocument();
    });

    it("should not crash with null data and should display appropriate message", () => {
      const { container } = renderWithTooltip(
        <AnalysisDashboard data={null} />
      );

      // Should render a single message container, not the full dashboard
      const message = screen.getByText(/no analysis available/i);
      expect(message).toBeInTheDocument();

      // Should NOT render section headers when data is null
      expect(screen.queryByText("Summary")).not.toBeInTheDocument();
      expect(screen.queryByText("Risk Flags")).not.toBeInTheDocument();
    });
  });

  describe("Empty State Styling", () => {
    it("empty state messages should use muted foreground color", () => {
      renderWithTooltip(<RiskFlags risks={[]} />);
      const message = screen.getByText(/no risk flags identified/i);
      expect(message).toHaveClass("text-muted-foreground");
    });

    it("empty state messages should use small text size", () => {
      renderWithTooltip(<FinancialItems items={[]} />);
      const message = screen.getByText(/no financial items/i);
      expect(message).toHaveClass("text-sm");
    });
  });
});
