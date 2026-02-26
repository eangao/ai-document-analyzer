import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnalysisLoader } from "@/components/AnalysisLoader";

describe("AnalysisLoader", () => {
  it("renders the uploading step when step is 'uploading'", () => {
    render(<AnalysisLoader step="uploading" />);
    expect(screen.getByText("Uploading PDF...")).toBeInTheDocument();
  });

  it("renders the extracting step when step is 'extracting'", () => {
    render(<AnalysisLoader step="extracting" />);
    expect(screen.getByText("Extracting text...")).toBeInTheDocument();
  });

  it("renders the analyzing step when step is 'analyzing'", () => {
    render(<AnalysisLoader step="analyzing" />);
    expect(screen.getByText("Analyzing document...")).toBeInTheDocument();
  });

  it("shows previous steps as completed", () => {
    render(<AnalysisLoader step="analyzing" />);
    // Uploading and extracting should be marked complete
    const completedSteps = screen.getAllByTestId("step-complete");
    expect(completedSteps).toHaveLength(2);
  });

  it("shows the current step as active with a spinner", () => {
    render(<AnalysisLoader step="extracting" />);
    const activeStep = screen.getByTestId("step-active");
    expect(activeStep).toBeInTheDocument();
  });

  it("shows future steps as pending", () => {
    render(<AnalysisLoader step="uploading" />);
    const pendingSteps = screen.getAllByTestId("step-pending");
    expect(pendingSteps).toHaveLength(2);
  });

  it("renders all three step labels", () => {
    render(<AnalysisLoader step="uploading" />);
    expect(screen.getByText("Uploading PDF...")).toBeInTheDocument();
    expect(screen.getByText("Extracting text...")).toBeInTheDocument();
    expect(screen.getByText("Analyzing document...")).toBeInTheDocument();
  });

  it("has an accessible role", () => {
    render(<AnalysisLoader step="uploading" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
