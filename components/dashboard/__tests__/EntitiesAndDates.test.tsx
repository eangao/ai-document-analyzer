import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EntitiesAndDates } from "@/components/dashboard/EntitiesAndDates";
import type { Entity, KeyDate } from "@/types";

const renderWithTooltip = (component: React.ReactElement) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe("EntitiesAndDates", () => {
  const mockEntities: Entity[] = [
    {
      name: "Acme Corp",
      type: "organization",
      confidence: 0.95,
      context: "Buyer and primary stakeholder",
    },
    {
      name: "John Smith",
      type: "person",
      confidence: 0.88,
      context: "CEO of Acme Corp",
    },
  ];

  const mockDates: KeyDate[] = [
    { date: "2025-01-01", description: "Contract start date", importance: "high" },
    {
      date: "2025-06-30",
      description: "Payment due",
      importance: "medium",
    },
    {
      date: "2025-12-31",
      description: "Contract expiration",
      importance: "low",
    },
  ];

  it("renders entities section with title", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText("Entities")).toBeInTheDocument();
  });

  it("renders dates section with title", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText("Key Dates")).toBeInTheDocument();
  });

  it("displays all entities with names and types", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("displays all dates with descriptions", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText("Contract start date")).toBeInTheDocument();
    expect(screen.getByText("Payment due")).toBeInTheDocument();
    expect(screen.getByText("Contract expiration")).toBeInTheDocument();
  });

  it("shows entity types", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText("organization")).toBeInTheDocument();
    expect(screen.getByText("person")).toBeInTheDocument();
  });

  it("shows confidence levels for entities", () => {
    renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    expect(screen.getByText(/95%/)).toBeInTheDocument();
    expect(screen.getByText(/88%/)).toBeInTheDocument();
  });

  it("displays date importance badges", () => {
    const { container } = renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    // Check for badge elements with importance levels
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("renders entity tooltips with context", async () => {
    const { container } = renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    // Info icon SVG should be present for tooltip trigger
    const infoIcon = container.querySelector('svg[class*="h-3"]');
    expect(infoIcon).toBeInTheDocument();
  });

  it("renders empty state for entities", () => {
    renderWithTooltip(
      <EntitiesAndDates
        entities={[]}
        dates={[
          { date: "2025-01-01", description: "Test", importance: "high" },
        ]}
      />
    );
    expect(
      screen.getByText(/no entities found/i)
    ).toBeInTheDocument();
  });

  it("renders empty state for dates", () => {
    renderWithTooltip(
      <EntitiesAndDates
        entities={[
          {
            name: "Test",
            type: "test",
            confidence: 0.9,
            context: "context",
          },
        ]}
        dates={[]}
      />
    );
    expect(
      screen.getByText(/no key dates found/i)
    ).toBeInTheDocument();
  });

  it("has responsive two-column grid layout", () => {
    const { container } = renderWithTooltip(
      <EntitiesAndDates entities={mockEntities} dates={mockDates} />
    );
    const gridDiv = container.querySelector('[class*="grid"]');
    expect(gridDiv).toHaveClass("grid-cols-1");
    expect(gridDiv).toHaveClass("md:grid-cols-2");
  });

  it("formats date properly", () => {
    renderWithTooltip(
      <EntitiesAndDates
        entities={[]}
        dates={[
          { date: "2025-03-15", description: "Important deadline", importance: "high" },
        ]}
      />
    );
    expect(screen.getByText("2025-03-15")).toBeInTheDocument();
  });

  it("handles single entity and single date", () => {
    const singleEntity: Entity[] = [mockEntities[0]];
    const singleDate: KeyDate[] = [mockDates[0]];
    renderWithTooltip(
      <EntitiesAndDates entities={singleEntity} dates={singleDate} />
    );
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Contract start date")).toBeInTheDocument();
  });

  it("handles many entities and dates", () => {
    const manyEntities = Array.from({ length: 10 }, (_, i) => ({
      name: `Entity ${i + 1}`,
      type: "type",
      confidence: 0.9,
      context: "context",
    }));
    const manyDates = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-${String(i + 1).padStart(2, "0")}-01`,
      description: `Date ${i + 1}`,
      importance: "high" as const,
    }));
    renderWithTooltip(
      <EntitiesAndDates entities={manyEntities} dates={manyDates} />
    );
    expect(screen.getByText("Entity 1")).toBeInTheDocument();
    expect(screen.getByText("Entity 10")).toBeInTheDocument();
  });

  it("applies high importance badge styling to dates", () => {
    const { container } = renderWithTooltip(
      <EntitiesAndDates
        entities={[]}
        dates={[
          { date: "2025-01-01", description: "High priority", importance: "high" },
        ]}
      />
    );
    const highBadge = container.querySelector('[class*="bg-red"]');
    expect(highBadge).toBeInTheDocument();
  });
});
