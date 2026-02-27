import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/app/page";
import type { DocumentAnalysis } from "@/types";

// Mock the FileUpload component to simulate upload completion
vi.mock("@/components/FileUpload", () => ({
  FileUpload: ({
    onAnalysisComplete,
  }: {
    onAnalysisComplete: (data: DocumentAnalysis) => void;
  }) => {
    const mockAnalysis: DocumentAnalysis = {
      summary: "Test contract analysis",
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

    return (
      <button
        onClick={() => onAnalysisComplete(mockAnalysis)}
        data-testid="mock-upload"
      >
        Mock Upload
      </button>
    );
  },
}));

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe("Home Page - Phase 3.1 Integration", () => {
  it("should render AnalysisDashboard instead of JSON preview when analysis is complete", async () => {
    renderWithTooltip(<Home />);

    // Simulate file upload completion
    const uploadButton = screen.getByTestId("mock-upload");
    uploadButton.click();

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // CRITICAL TEST: Verify AnalysisDashboard is rendered, NOT the <pre> JSON block
    // This should FAIL initially because we haven't imported AnalysisDashboard yet
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Risk Flags")).toBeInTheDocument();
    expect(screen.getByText("Entities")).toBeInTheDocument();
    expect(screen.getByText("Key Dates")).toBeInTheDocument();

    // Verify the <pre> JSON block is NOT present
    const preElement = screen.queryByText((content, element) => {
      return element?.tagName === "PRE" ? true : false;
    });
    expect(preElement).not.toBeInTheDocument();
  });

  it("should render dashboard sections with proper data from analysis", async () => {
    renderWithTooltip(<Home />);

    const uploadButton = screen.getByTestId("mock-upload");
    uploadButton.click();

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Verify dashboard sections display the correct data
    expect(screen.getByText("Test contract analysis")).toBeInTheDocument();
    expect(screen.getByText("contract")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Risk 1")).toBeInTheDocument();
  });

  it("should still show Export and Analyze Another buttons", async () => {
    renderWithTooltip(<Home />);

    const uploadButton = screen.getByTestId("mock-upload");
    uploadButton.click();

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Verify buttons are still present
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
    expect(screen.getByText("Analyze Another")).toBeInTheDocument();
  });
});
