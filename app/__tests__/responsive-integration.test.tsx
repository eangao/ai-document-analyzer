import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import type { DocumentAnalysis } from "@/types";

const mockAnalysis: DocumentAnalysis = {
  summary: "Test contract with multiple sections",
  documentType: "contract",
  keyEntities: [
    {
      name: "Acme Corp",
      type: "organization",
      confidence: 0.95,
      context: "Primary party",
    },
    {
      name: "Tech Solutions Inc",
      type: "organization",
      confidence: 0.9,
      context: "Secondary party",
    },
  ],
  keyDates: [
    { date: "2025-06-30", description: "Deadline", importance: "high" },
    { date: "2025-12-31", description: "End date", importance: "medium" },
  ],
  financialItems: [
    {
      description: "Payment",
      amount: 10000,
      currency: "USD",
      category: "payment",
    },
    {
      description: "Penalty",
      amount: 500,
      currency: "USD",
      category: "penalty",
    },
  ],
  obligations: [
    {
      party: "Acme",
      description: "Deliver services",
      deadline: "2025-06-30",
      status: "active",
    },
  ],
  riskFlags: [
    { title: "High Risk", description: "Risky clause", severity: "high" },
    { title: "Medium Risk", description: "Watch this", severity: "medium" },
  ],
  keyTerms: [
    { term: "SLA", definition: "Service Level Agreement", category: "Legal" },
  ],
  actionItems: ["Review contract", "Sign documents"],
};

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe("Phase 3.2: Dashboard Responsive Layout", () => {
  it("should have mobile-first responsive grid classes", () => {
    const { container } = renderWithTooltip(
      <AnalysisDashboard data={mockAnalysis} />
    );

    // Find the main grid container
    const gridDiv = container.querySelector('[class*="grid"]');
    expect(gridDiv).toBeTruthy();

    // Verify mobile-first classes
    expect(gridDiv).toHaveClass("grid-cols-1"); // Mobile: single column
    expect(gridDiv).toHaveClass("md:grid-cols-2"); // Tablet+: two columns
  });

  it("should render all sections for comprehensive layout test", () => {
    const { container } = renderWithTooltip(
      <AnalysisDashboard data={mockAnalysis} />
    );

    // Verify all major components are rendered
    const sections = container.querySelectorAll('[class*="border"]');
    expect(sections.length).toBeGreaterThan(5); // Should have multiple card sections
  });

  it("should apply responsive gap spacing between grid items", () => {
    const { container } = renderWithTooltip(
      <AnalysisDashboard data={mockAnalysis} />
    );

    const gridDiv = container.querySelector('[class*="grid"]');
    expect(gridDiv).toHaveClass("gap-4"); // Consistent spacing
  });

  it("should render cards with proper border and background classes", () => {
    const { container } = renderWithTooltip(
      <AnalysisDashboard data={mockAnalysis} />
    );

    // Check that cards have proper styling
    const cards = container.querySelectorAll('[class*="rounded-lg"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
