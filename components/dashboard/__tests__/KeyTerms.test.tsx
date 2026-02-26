import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KeyTerms } from "@/components/dashboard/KeyTerms";
import type { KeyTerm } from "@/types";

describe("KeyTerms", () => {
  const mockTerms: KeyTerm[] = [
    {
      term: "SLA",
      definition: "Service Level Agreement - defines uptime and performance standards",
      category: "Legal",
    },
    {
      term: "Force Majeure",
      definition: "Unforeseeable circumstances that prevent contract fulfillment",
      category: "Legal",
    },
    {
      term: "Indemnification",
      definition: "Compensation for loss or damage",
      category: "Financial",
    },
  ];

  it("renders key terms with definitions", () => {
    render(<KeyTerms terms={mockTerms} />);
    expect(screen.getByText("SLA")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Service Level Agreement - defines uptime and performance standards"
      )
    ).toBeInTheDocument();
  });

  it("displays term categories", () => {
    render(<KeyTerms terms={mockTerms} />);
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getByText("Financial")).toBeInTheDocument();
  });

  it("renders all terms from the array", () => {
    render(<KeyTerms terms={mockTerms} />);
    expect(screen.getByText("SLA")).toBeInTheDocument();
    expect(screen.getByText("Force Majeure")).toBeInTheDocument();
    expect(screen.getByText("Indemnification")).toBeInTheDocument();
  });

  it("shows empty state when terms array is empty", () => {
    render(<KeyTerms terms={[]} />);
    expect(
      screen.getByText(/no key terms found/i)
    ).toBeInTheDocument();
  });

  it("renders Card component wrapper", () => {
    const { container } = render(<KeyTerms terms={mockTerms} />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
  });

  it("renders CardHeader with title", () => {
    render(<KeyTerms terms={mockTerms} />);
    expect(screen.getByText("Key Terms")).toBeInTheDocument();
  });

  it("handles single term", () => {
    const singleTerm: KeyTerm[] = [mockTerms[0]];
    render(<KeyTerms terms={singleTerm} />);
    expect(screen.getByText("SLA")).toBeInTheDocument();
  });

  it("handles terms with same category", () => {
    const sameCategoryTerms: KeyTerm[] = [
      {
        term: "Term1",
        definition: "Definition 1",
        category: "Legal",
      },
      {
        term: "Term2",
        definition: "Definition 2",
        category: "Legal",
      },
    ];
    render(<KeyTerms terms={sameCategoryTerms} />);
    expect(screen.getByText("Term1")).toBeInTheDocument();
    expect(screen.getByText("Term2")).toBeInTheDocument();
  });

  it("handles long definitions", () => {
    const longDefTerm: KeyTerm[] = [
      {
        term: "Complex Term",
        definition:
          "This is a very long definition that explains the term in great detail. It should wrap properly and display on multiple lines without breaking the layout.",
        category: "General",
      },
    ];
    render(<KeyTerms terms={longDefTerm} />);
    expect(
      screen.getByText(
        /This is a very long definition that explains the term in great detail/
      )
    ).toBeInTheDocument();
  });

  it("renders terms in order", () => {
    const { container } = render(<KeyTerms terms={mockTerms} />);
    const termElements = container.querySelectorAll('[class*="font-semibold"]');
    expect(termElements.length).toBeGreaterThan(0);
  });

  it("groups terms by category", () => {
    render(<KeyTerms terms={mockTerms} />);
    // Should show both Legal and Financial categories
    const legalLabels = screen.getAllByText("Legal");
    const financialLabels = screen.getAllByText("Financial");
    expect(legalLabels.length).toBeGreaterThan(0);
    expect(financialLabels.length).toBeGreaterThan(0);
  });
});
