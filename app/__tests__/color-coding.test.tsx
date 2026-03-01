import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RiskFlags } from "@/components/dashboard/RiskFlags";
import { FinancialItems } from "@/components/dashboard/FinancialItems";
import type { DocumentType, RiskFlag, FinancialItem } from "@/types";

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe("Phase 3.3: Color Coding & Visual Hierarchy", () => {
  describe("SummaryCard - Document Type Colors", () => {
    it("should apply blue color for contract documents", () => {
      const { container } = renderWithTooltip(
        <SummaryCard documentType="contract" summary="Test contract" />
      );
      const badge = screen.getByText("contract");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    it("should apply green color for invoice documents", () => {
      const { container } = renderWithTooltip(
        <SummaryCard documentType="invoice" summary="Test invoice" />
      );
      const badge = screen.getByText("invoice");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
    });

    it("should apply purple color for report documents", () => {
      const { container } = renderWithTooltip(
        <SummaryCard documentType="report" summary="Test report" />
      );
      const badge = screen.getByText("report");
      expect(badge).toHaveClass("bg-purple-100");
      expect(badge).toHaveClass("text-purple-800");
    });

    it("should apply red color for legal documents", () => {
      const { container } = renderWithTooltip(
        <SummaryCard documentType="legal" summary="Test legal doc" />
      );
      const badge = screen.getByText("legal");
      expect(badge).toHaveClass("bg-red-100");
      expect(badge).toHaveClass("text-red-800");
    });

    it("should apply yellow color for financial documents", () => {
      const { container } = renderWithTooltip(
        <SummaryCard documentType="financial" summary="Test financial doc" />
      );
      const badge = screen.getByText("financial");
      expect(badge).toHaveClass("bg-yellow-100");
      expect(badge).toHaveClass("text-yellow-800");
    });
  });

  describe("RiskFlags - Severity Colors", () => {
    it("should apply red colors for high severity risks", () => {
      const risks: RiskFlag[] = [
        {
          title: "Critical Risk",
          description: "High severity issue",
          severity: "high",
        },
      ];
      const { container } = renderWithTooltip(<RiskFlags risks={risks} />);

      // Check for red border
      const alert = container.querySelector('[class*="border-red-500"]');
      expect(alert).toBeTruthy();

      // Check for red background
      expect(alert).toHaveClass("bg-red-50");

      // Check for red icon color
      const icon = container.querySelector('[class*="text-red-600"]');
      expect(icon).toBeTruthy();
    });

    it("should apply yellow colors for medium severity risks", () => {
      const risks: RiskFlag[] = [
        {
          title: "Medium Risk",
          description: "Medium severity issue",
          severity: "medium",
        },
      ];
      const { container } = renderWithTooltip(<RiskFlags risks={risks} />);

      const alert = container.querySelector('[class*="border-yellow-500"]');
      expect(alert).toBeTruthy();
      expect(alert).toHaveClass("bg-yellow-50");

      const icon = container.querySelector('[class*="text-yellow-600"]');
      expect(icon).toBeTruthy();
    });

    it("should apply blue colors for low severity risks", () => {
      const risks: RiskFlag[] = [
        {
          title: "Low Risk",
          description: "Low severity issue",
          severity: "low",
        },
      ];
      const { container } = renderWithTooltip(<RiskFlags risks={risks} />);

      const alert = container.querySelector('[class*="border-blue-500"]');
      expect(alert).toBeTruthy();
      expect(alert).toHaveClass("bg-blue-50");

      const icon = container.querySelector('[class*="text-blue-600"]');
      expect(icon).toBeTruthy();
    });
  });

  describe("FinancialItems - Category Colors", () => {
    it("should apply green color for payment items", () => {
      const items: FinancialItem[] = [
        {
          description: "Monthly Payment",
          amount: 1000,
          currency: "USD",
          category: "payment",
        },
      ];
      const { container } = renderWithTooltip(<FinancialItems items={items} />);

      const paymentItem = container.querySelector('[class*="text-green-700"]');
      expect(paymentItem).toBeTruthy();
    });

    it("should apply red color for penalty items", () => {
      const items: FinancialItem[] = [
        {
          description: "Late Fee",
          amount: 500,
          currency: "USD",
          category: "penalty",
        },
      ];
      const { container } = renderWithTooltip(<FinancialItems items={items} />);

      const penaltyItem = container.querySelector('[class*="text-red-700"]');
      expect(penaltyItem).toBeTruthy();
    });

    it("should apply bold font for total items", () => {
      const items: FinancialItem[] = [
        {
          description: "Total Amount",
          amount: 10000,
          currency: "USD",
          category: "total",
        },
      ];
      const { container } = renderWithTooltip(<FinancialItems items={items} />);

      const totalAmount = container.querySelector('[class*="font-bold"]');
      expect(totalAmount).toBeTruthy();
    });

    it("should apply purple color for discount items", () => {
      const items: FinancialItem[] = [
        {
          description: "Early Payment Discount",
          amount: 200,
          currency: "USD",
          category: "discount",
        },
      ];
      const { container } = renderWithTooltip(<FinancialItems items={items} />);

      const discountItem = container.querySelector('[class*="text-purple-700"]');
      expect(discountItem).toBeTruthy();
    });
  });

  describe("Visual Hierarchy", () => {
    it("should make total amounts prominent with bold font weight", () => {
      const items: FinancialItem[] = [
        {
          description: "Total",
          amount: 5000,
          currency: "USD",
          category: "total",
        },
        {
          description: "Payment",
          amount: 1000,
          currency: "USD",
          category: "payment",
        },
      ];
      const { container } = renderWithTooltip(<FinancialItems items={items} />);

      // Total should have font-bold class
      const boldElements = container.querySelectorAll('[class*="font-bold"]');
      expect(boldElements.length).toBeGreaterThan(0);
    });

    it("should differentiate risk severities visually with distinct colors", () => {
      const risks: RiskFlag[] = [
        { title: "High", description: "High", severity: "high" },
        { title: "Medium", description: "Medium", severity: "medium" },
        { title: "Low", description: "Low", severity: "low" },
      ];
      const { container } = renderWithTooltip(<RiskFlags risks={risks} />);

      // Should have all three different border colors
      expect(container.querySelector('[class*="border-red-500"]')).toBeTruthy();
      expect(container.querySelector('[class*="border-yellow-500"]')).toBeTruthy();
      expect(container.querySelector('[class*="border-blue-500"]')).toBeTruthy();
    });
  });
});
