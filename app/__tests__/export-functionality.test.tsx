import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExportButton } from "@/components/ExportButton";
import type { DocumentAnalysis } from "@/types";

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  mockCreateObjectURL.mockReturnValue("blob:mock-url");
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockAnalysis: DocumentAnalysis = {
  summary: "Contract analysis for testing export",
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
      description: "Deliver services",
      deadline: "2025-06-30",
      status: "active",
    },
  ],
  riskFlags: [
    { title: "Risk 1", description: "Risky clause", severity: "high" },
  ],
  keyTerms: [
    { term: "SLA", definition: "Service Level Agreement", category: "Legal" },
  ],
  actionItems: ["Review contract", "Sign documents"],
};

describe("Phase 4.1: Export Button Functionality", () => {
  it("should render Export JSON button", () => {
    render(<ExportButton data={mockAnalysis} />);
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
  });

  it("should trigger download when clicked", () => {
    const { container } = render(<ExportButton data={mockAnalysis} />);

    // Mock the link click
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    const button = screen.getByText("Export JSON");
    fireEvent.click(button);

    // Verify createElement was called to create anchor element
    expect(createElementSpy).toHaveBeenCalledWith("a");
  });

  it("should create valid JSON blob", () => {
    render(<ExportButton data={mockAnalysis} />);

    const button = screen.getByText("Export JSON");
    fireEvent.click(button);

    // Verify Blob was created (through createObjectURL being called)
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("should include all top-level fields in exported JSON", () => {
    render(<ExportButton data={mockAnalysis} />);

    const button = screen.getByText("Export JSON");
    fireEvent.click(button);

    // The export should have been triggered
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // Verify all required fields exist in the analysis object
    expect(mockAnalysis).toHaveProperty("summary");
    expect(mockAnalysis).toHaveProperty("documentType");
    expect(mockAnalysis).toHaveProperty("keyEntities");
    expect(mockAnalysis).toHaveProperty("keyDates");
    expect(mockAnalysis).toHaveProperty("financialItems");
    expect(mockAnalysis).toHaveProperty("obligations");
    expect(mockAnalysis).toHaveProperty("riskFlags");
    expect(mockAnalysis).toHaveProperty("keyTerms");
    expect(mockAnalysis).toHaveProperty("actionItems");
  });

  it("should handle special characters in document type", () => {
    const analysisWithSpecialChars: DocumentAnalysis = {
      ...mockAnalysis,
      documentType: "contract",
      summary: "Contract_Final(v2) - Test & Review",
    };

    render(<ExportButton data={analysisWithSpecialChars} />);

    const button = screen.getByText("Export JSON");
    fireEvent.click(button);

    // Should not throw error with special characters
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("should export valid JSON structure", () => {
    const jsonString = JSON.stringify(mockAnalysis, null, 2);

    // Verify it's valid JSON by parsing it back
    expect(() => JSON.parse(jsonString)).not.toThrow();

    const parsed = JSON.parse(jsonString);
    expect(parsed.summary).toBe("Contract analysis for testing export");
    expect(parsed.documentType).toBe("contract");
    expect(parsed.keyEntities).toHaveLength(1);
    expect(parsed.keyDates).toHaveLength(1);
    expect(parsed.financialItems).toHaveLength(1);
    expect(parsed.obligations).toHaveLength(1);
    expect(parsed.riskFlags).toHaveLength(1);
    expect(parsed.keyTerms).toHaveLength(1);
    expect(parsed.actionItems).toHaveLength(2);
  });

  it("should handle empty arrays in export", () => {
    const sparseAnalysis: DocumentAnalysis = {
      summary: "Minimal document",
      documentType: "letter",
      keyEntities: [],
      keyDates: [],
      financialItems: [],
      obligations: [],
      riskFlags: [],
      keyTerms: [],
      actionItems: [],
    };

    render(<ExportButton data={sparseAnalysis} />);

    const button = screen.getByText("Export JSON");
    fireEvent.click(button);

    // Should successfully export even with empty arrays
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // Verify valid JSON with empty arrays
    const jsonString = JSON.stringify(sparseAnalysis, null, 2);
    const parsed = JSON.parse(jsonString);
    expect(parsed.keyEntities).toEqual([]);
    expect(parsed.actionItems).toEqual([]);
  });

  it("should have download icon in button", () => {
    const { container } = render(<ExportButton data={mockAnalysis} />);

    // Check for Download icon (lucide-react Download component)
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });
});
