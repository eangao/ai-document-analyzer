import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import type { DocumentType } from "@/types";

describe("SummaryCard", () => {
  it("renders the summary text", () => {
    const summary = "This is a test contract summary.";
    render(<SummaryCard documentType="contract" summary={summary} />);
    expect(screen.getByText(summary)).toBeInTheDocument();
  });

  it("renders document type badge with correct text", () => {
    render(<SummaryCard documentType="contract" summary="Test" />);
    expect(screen.getByText("contract")).toBeInTheDocument();
  });

  it("renders different document types", () => {
    const types: DocumentType[] = [
      "contract",
      "invoice",
      "report",
      "letter",
      "legal",
      "financial",
      "other",
    ];

    types.forEach((type) => {
      const { unmount } = render(
        <SummaryCard documentType={type} summary="Test" />
      );
      expect(screen.getByText(type)).toBeInTheDocument();
      unmount();
    });
  });

  it("applies color-coded badge variant for contract (blue)", () => {
    const { container } = render(
      <SummaryCard documentType="contract" summary="Test" />
    );
    const badge = container.querySelector('[class*="bg-blue"]');
    expect(badge).toBeInTheDocument();
  });

  it("applies color-coded badge variant for invoice (green)", () => {
    const { container } = render(
      <SummaryCard documentType="invoice" summary="Test" />
    );
    const badge = container.querySelector('[class*="bg-green"]');
    expect(badge).toBeInTheDocument();
  });

  it("applies color-coded badge variant for report (purple)", () => {
    const { container } = render(
      <SummaryCard documentType="report" summary="Test" />
    );
    const badge = container.querySelector('[class*="bg-purple"]');
    expect(badge).toBeInTheDocument();
  });

  it("applies color-coded badge variant for legal (red)", () => {
    const { container } = render(
      <SummaryCard documentType="legal" summary="Test" />
    );
    const badge = container.querySelector('[class*="bg-red"]');
    expect(badge).toBeInTheDocument();
  });

  it("applies color-coded badge variant for financial (yellow)", () => {
    const { container } = render(
      <SummaryCard documentType="financial" summary="Test" />
    );
    const badge = container.querySelector('[class*="bg-yellow"]');
    expect(badge).toBeInTheDocument();
  });

  it("renders Card component with proper structure", () => {
    const { container } = render(
      <SummaryCard documentType="contract" summary="Test summary" />
    );
    // Check that Card renders with border and rounded corners
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("border");
    expect(cardElement).toHaveClass("rounded-xl");
  });

  it("handles long summary text", () => {
    const longSummary =
      "This is a very long summary that contains a lot of text and should wrap properly without breaking the layout. It should display all the content even if it spans multiple lines.";
    render(<SummaryCard documentType="contract" summary={longSummary} />);
    expect(screen.getByText(longSummary)).toBeInTheDocument();
  });
});
