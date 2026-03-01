import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/app/page";
import type { DocumentAnalysis } from "@/types";

// Mock the FileUpload component
vi.mock("@/components/FileUpload", () => ({
  FileUpload: ({
    onAnalysisComplete,
  }: {
    onAnalysisComplete: (data: DocumentAnalysis) => void;
  }) => {
    const mockAnalysis: DocumentAnalysis = {
      summary: "Test analysis",
      documentType: "contract",
      keyEntities: [],
      keyDates: [],
      financialItems: [],
      obligations: [],
      riskFlags: [],
      keyTerms: [],
      actionItems: [],
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

describe("Desktop Width - Dashboard Container", () => {
  it("should use wider container (max-w-7xl) for dashboard on desktop", async () => {
    const { container } = renderWithTooltip(<Home />);

    // Trigger analysis
    const uploadButton = screen.getByTestId("mock-upload");
    uploadButton.click();

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Find the main element
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeTruthy();

    // When showing dashboard (complete state), should use max-w-7xl for better desktop layout
    expect(mainElement).toHaveClass("max-w-7xl");
  });

  it("should use narrower container (max-w-5xl) for upload state", () => {
    const { container } = renderWithTooltip(<Home />);

    // In idle state (upload screen)
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeTruthy();

    // Upload/idle state should remain narrow (max-w-5xl) for better readability
    expect(mainElement).toHaveClass("max-w-5xl");
  });
});
