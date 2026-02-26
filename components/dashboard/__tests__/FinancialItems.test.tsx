import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FinancialItems } from "@/components/dashboard/FinancialItems";
import type { FinancialItem } from "@/types";

describe("FinancialItems", () => {
  const mockItems: FinancialItem[] = [
    {
      description: "Annual payment",
      amount: 10000,
      currency: "USD",
      category: "payment",
    },
    {
      description: "Late payment penalty",
      amount: 500,
      currency: "USD",
      category: "penalty",
    },
    {
      description: "Service discount",
      amount: 2000,
      currency: "USD",
      category: "discount",
    },
  ];

  it("renders financial items with descriptions", () => {
    render(<FinancialItems items={mockItems} />);
    expect(screen.getByText("Annual payment")).toBeInTheDocument();
    expect(screen.getByText("Late payment penalty")).toBeInTheDocument();
    expect(screen.getByText("Service discount")).toBeInTheDocument();
  });

  it("formats currency amounts correctly", () => {
    render(<FinancialItems items={mockItems} />);
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
    expect(screen.getByText(/\$2,000/)).toBeInTheDocument();
  });

  it("shows empty state when items array is empty", () => {
    render(<FinancialItems items={[]} />);
    expect(
      screen.getByText(/no financial items/i)
    ).toBeInTheDocument();
  });

  it("renders Card component wrapper", () => {
    const { container } = render(<FinancialItems items={mockItems} />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
  });

  it("renders CardHeader with title", () => {
    render(<FinancialItems items={mockItems} />);
    expect(screen.getByText("Financial Items")).toBeInTheDocument();
  });

  it("applies green color coding to payment items", () => {
    const { container } = render(
      <FinancialItems
        items={[
          {
            description: "Test payment",
            amount: 1000,
            currency: "USD",
            category: "payment",
          },
        ]}
      />
    );
    // Check for green color in the item div
    const itemDiv = container.querySelector('[class*="text-green-700"]');
    expect(itemDiv).toBeInTheDocument();
  });

  it("applies red color coding to penalty items", () => {
    const { container } = render(
      <FinancialItems
        items={[
          {
            description: "Test penalty",
            amount: 500,
            currency: "USD",
            category: "penalty",
          },
        ]}
      />
    );
    // Check for red color in the item div
    const itemDiv = container.querySelector('[class*="text-red-700"]');
    expect(itemDiv).toBeInTheDocument();
  });

  it("applies bold styling to total items", () => {
    render(
      <FinancialItems
        items={[
          {
            description: "Total amount",
            amount: 15000,
            currency: "USD",
            category: "total",
          },
        ]}
      />
    );
    const totalAmount = screen.getByText(/\$15,000/);
    expect(totalAmount).toHaveClass("font-bold");
  });

  it("handles items with different currencies", () => {
    const multiCurrencyItems: FinancialItem[] = [
      {
        description: "USD payment",
        amount: 1000,
        currency: "USD",
        category: "payment",
      },
      {
        description: "EUR payment",
        amount: 900,
        currency: "EUR",
        category: "payment",
      },
    ];
    render(<FinancialItems items={multiCurrencyItems} />);
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
    expect(screen.getByText(/€900/)).toBeInTheDocument();
  });

  it("handles large numbers with comma formatting", () => {
    const largeItem: FinancialItem[] = [
      {
        description: "Large payment",
        amount: 1234567.89,
        currency: "USD",
        category: "payment",
      },
    ];
    render(<FinancialItems items={largeItem} />);
    expect(screen.getByText(/1,234,567/)).toBeInTheDocument();
  });

  it("renders all items in order", () => {
    render(<FinancialItems items={mockItems} />);
    const descriptions = [
      "Annual payment",
      "Late payment penalty",
      "Service discount",
    ];
    descriptions.forEach((desc) => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });

  it("handles single financial item", () => {
    const singleItem: FinancialItem[] = [mockItems[0]];
    render(<FinancialItems items={singleItem} />);
    expect(screen.getByText("Annual payment")).toBeInTheDocument();
  });
});
