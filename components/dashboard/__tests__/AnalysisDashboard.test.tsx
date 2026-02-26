import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import type { DocumentAnalysis } from "@/types";

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

const mockAnalysis: DocumentAnalysis = {
  summary: "This is a test contract.",
  documentType: "contract",
  keyEntities: [
    {
      name: "Acme Corp",
      type: "organization",
      confidence: 0.95,
      context: "Primary party",
    },
  ],
  keyDates: [
    { date: "2025-06-30", description: "Deadline", importance: "high" },
  ],
  financialItems: [
    {
      description: "Payment",
      amount: 10000,
      currency: "USD",
      category: "payment",
    },
  ],
  obligations: [
    {
      party: "Acme",
      description: "Deliver",
      deadline: "2025-06-30",
      status: "active",
    },
  ],
  riskFlags: [
    { title: "Risk 1", description: "Risky", severity: "high" },
  ],
  keyTerms: [
    { term: "SLA", definition: "Agreement", category: "Legal" },
  ],
  actionItems: ["Review"],
};

describe("AnalysisDashboard", () => {
  it("renders null state when data is null", () => {
    renderWithTooltip(<AnalysisDashboard data={null} />);
    expect(
      screen.getByText(/no analysis available/i)
    ).toBeInTheDocument();
  });

  it("renders all dashboard components when data is present", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    // Check for all major section titles
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Risk Flags")).toBeInTheDocument();
    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(screen.getByText("Key Dates")).toBeInTheDocument();
    expect(screen.getByText("Financial Items")).toBeInTheDocument();
    expect(screen.getByText("Obligations")).toBeInTheDocument();
    expect(screen.getByText("Key Terms")).toBeInTheDocument();
    expect(screen.getByText("Action Items")).toBeInTheDocument();
  });

  it("renders SummaryCard with document type and summary", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getByText("contract")).toBeInTheDocument();
    expect(screen.getByText("This is a test contract.")).toBeInTheDocument();
  });

  it("renders RiskFlags component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getByText("Risk 1")).toBeInTheDocument();
    expect(screen.getByText("Risky")).toBeInTheDocument();
  });

  it("renders EntitiesAndDates component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2025-06-30").length).toBeGreaterThan(0);
  });

  it("renders FinancialItems component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });

  it("renders ObligationsTable component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deliver").length).toBeGreaterThan(0);
  });

  it("renders KeyTerms component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getAllByText("SLA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agreement").length).toBeGreaterThan(0);
  });

  it("renders ActionItems component", () => {
    renderWithTooltip(<AnalysisDashboard data={mockAnalysis} />);
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("has responsive grid layout", () => {
    const { container } = renderWithTooltip(
      <AnalysisDashboard data={mockAnalysis} />
    );
    const gridDiv = container.querySelector('[class*="grid"]');
    expect(gridDiv).toHaveClass("grid-cols-1");
    expect(gridDiv).toHaveClass("md:grid-cols-2");
  });

  it("handles empty entities and dates arrays", () => {
    const analysisWithoutEntitiesAndDates: DocumentAnalysis = {
      ...mockAnalysis,
      keyEntities: [],
      keyDates: [],
    };
    renderWithTooltip(
      <AnalysisDashboard data={analysisWithoutEntitiesAndDates} />
    );
    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(screen.getByText(/no entities found/i)).toBeInTheDocument();
    expect(screen.getByText(/no key dates found/i)).toBeInTheDocument();
  });

  it("handles empty risk flags array", () => {
    const analysisWithoutRisks: DocumentAnalysis = {
      ...mockAnalysis,
      riskFlags: [],
    };
    renderWithTooltip(<AnalysisDashboard data={analysisWithoutRisks} />);
    expect(screen.getByText("Risk Flags")).toBeInTheDocument();
    expect(screen.getByText(/no risk flags identified/i)).toBeInTheDocument();
  });

  it("handles empty obligations array", () => {
    const analysisWithoutObligations: DocumentAnalysis = {
      ...mockAnalysis,
      obligations: [],
    };
    renderWithTooltip(
      <AnalysisDashboard data={analysisWithoutObligations} />
    );
    expect(screen.getByText("Obligations")).toBeInTheDocument();
    expect(screen.getByText(/no obligations/i)).toBeInTheDocument();
  });

  it("handles empty key terms array", () => {
    const analysisWithoutTerms: DocumentAnalysis = {
      ...mockAnalysis,
      keyTerms: [],
    };
    renderWithTooltip(<AnalysisDashboard data={analysisWithoutTerms} />);
    expect(screen.getByText("Key Terms")).toBeInTheDocument();
    expect(screen.getByText(/no key terms found/i)).toBeInTheDocument();
  });

  it("handles empty action items array", () => {
    const analysisWithoutActions: DocumentAnalysis = {
      ...mockAnalysis,
      actionItems: [],
    };
    renderWithTooltip(<AnalysisDashboard data={analysisWithoutActions} />);
    expect(screen.getByText("Action Items")).toBeInTheDocument();
    expect(screen.getByText(/no action items/i)).toBeInTheDocument();
  });

  it("handles empty financial items array", () => {
    const analysisWithoutFinancials: DocumentAnalysis = {
      ...mockAnalysis,
      financialItems: [],
    };
    renderWithTooltip(
      <AnalysisDashboard data={analysisWithoutFinancials} />
    );
    expect(screen.getByText("Financial Items")).toBeInTheDocument();
    expect(screen.getByText(/no financial items/i)).toBeInTheDocument();
  });

  it("renders with full dataset with all arrays populated", () => {
    const fullAnalysis: DocumentAnalysis = {
      summary: "Complete contract analysis",
      documentType: "contract",
      keyEntities: [
        {
          name: "Company A",
          type: "org",
          confidence: 0.9,
          context: "Seller",
        },
        {
          name: "Company B",
          type: "org",
          confidence: 0.85,
          context: "Buyer",
        },
      ],
      keyDates: [
        {
          date: "2025-01-01",
          description: "Start",
          importance: "high",
        },
        {
          date: "2025-12-31",
          description: "End",
          importance: "low",
        },
      ],
      financialItems: [
        {
          description: "Payment 1",
          amount: 5000,
          currency: "USD",
          category: "payment",
        },
        {
          description: "Payment 2",
          amount: 5000,
          currency: "USD",
          category: "payment",
        },
      ],
      obligations: [
        {
          party: "Company A",
          description: "Obligation 1",
          deadline: "2025-06-30",
          status: "active",
        },
        {
          party: "Company B",
          description: "Obligation 2",
          deadline: "2025-12-31",
          status: "pending",
        },
      ],
      riskFlags: [
        {
          title: "Risk 1",
          description: "High risk",
          severity: "high",
        },
        {
          title: "Risk 2",
          description: "Medium risk",
          severity: "medium",
        },
      ],
      keyTerms: [
        {
          term: "Term 1",
          definition: "Definition 1",
          category: "Legal",
        },
        {
          term: "Term 2",
          definition: "Definition 2",
          category: "Financial",
        },
      ],
      actionItems: ["Action 1", "Action 2", "Action 3"],
    };
    renderWithTooltip(<AnalysisDashboard data={fullAnalysis} />);
    // Verify all components are rendered
    expect(screen.getAllByText("Complete contract analysis").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Company A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Company B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payment 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payment 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Obligation 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Risk 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Risk 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Term 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Term 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Action 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Action 3").length).toBeGreaterThan(0);
  });
});
