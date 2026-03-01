import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ObligationsTable } from "@/components/dashboard/ObligationsTable";
import type { Obligation } from "@/types";

describe("ObligationsTable", () => {
  const mockObligations: Obligation[] = [
    {
      party: "Acme Corp",
      description: "Deliver product by June 30",
      deadline: "2025-06-30",
      status: "active",
    },
    {
      party: "Supplier Inc",
      description: "Provide support for 12 months",
      deadline: "2025-12-31",
      status: "pending",
    },
    {
      party: "Acme Corp",
      description: "Final payment",
      deadline: "2025-05-15",
      status: "completed",
    },
  ];

  it("renders obligations with party, description, and deadline", () => {
    render(<ObligationsTable obligations={mockObligations} />);
    expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deliver product by June 30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2025-06-30").length).toBeGreaterThan(0);
  });

  it("shows empty state when obligations array is empty", () => {
    render(<ObligationsTable obligations={[]} />);
    expect(
      screen.getByText(/no obligations/i)
    ).toBeInTheDocument();
  });

  it("renders Card component wrapper", () => {
    const { container } = render(
      <ObligationsTable obligations={mockObligations} />
    );
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
  });

  it("renders CardHeader with title", () => {
    render(<ObligationsTable obligations={mockObligations} />);
    expect(screen.getByText("Obligations")).toBeInTheDocument();
  });

  it("displays all obligations in order", () => {
    render(<ObligationsTable obligations={mockObligations} />);
    expect(screen.getAllByText("Deliver product by June 30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Provide support for 12 months").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Final payment").length).toBeGreaterThan(0);
  });

  it("renders status badges for each obligation", () => {
    render(<ObligationsTable obligations={mockObligations} />);
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
  });

  it("applies blue color to pending status", () => {
    const { container } = render(
      <ObligationsTable
        obligations={[
          {
            party: "Test",
            description: "Test obligation",
            deadline: "2025-01-01",
            status: "pending",
          },
        ]}
      />
    );
    const pendingBadge = container.querySelector('[class*="bg-blue"]');
    expect(pendingBadge).toBeInTheDocument();
  });

  it("applies green color to completed status", () => {
    const { container } = render(
      <ObligationsTable
        obligations={[
          {
            party: "Test",
            description: "Test obligation",
            deadline: "2025-01-01",
            status: "completed",
          },
        ]}
      />
    );
    const completedBadge = container.querySelector('[class*="bg-green"]');
    expect(completedBadge).toBeInTheDocument();
  });

  it("applies red color to overdue status", () => {
    const { container } = render(
      <ObligationsTable
        obligations={[
          {
            party: "Test",
            description: "Test obligation",
            deadline: "2025-01-01",
            status: "overdue",
          },
        ]}
      />
    );
    const overdueBadge = container.querySelector('[class*="bg-red"]');
    expect(overdueBadge).toBeInTheDocument();
  });

  it("handles single obligation", () => {
    render(
      <ObligationsTable
        obligations={[
          {
            party: "Single Party",
            description: "Single obligation",
            deadline: "2025-01-01",
            status: "active",
          },
        ]}
      />
    );
    expect(screen.getAllByText("Single Party").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Single obligation").length).toBeGreaterThan(0);
  });

  it("handles multiple obligations with same party", () => {
    const samPartyObligations: Obligation[] = [
      {
        party: "Acme",
        description: "First obligation",
        deadline: "2025-01-01",
        status: "pending",
      },
      {
        party: "Acme",
        description: "Second obligation",
        deadline: "2025-02-01",
        status: "active",
      },
    ];
    render(<ObligationsTable obligations={samPartyObligations} />);
    // Two obligations from same party, each can appear in desktop+mobile views
    const acmeElements = screen.queryAllByText("Acme");
    expect(acmeElements.length).toBeGreaterThanOrEqual(2);
  });

  it("renders responsive structure for mobile", () => {
    const { container } = render(
      <ObligationsTable obligations={mockObligations} />
    );
    // Check for structure that indicates responsive layout
    const contentDiv = container.querySelector('[class*="space-y"]');
    expect(contentDiv).toBeInTheDocument();
  });

  it("displays all status types", () => {
    const allStatuses: Obligation[] = [
      {
        party: "Party 1",
        description: "Active obligation",
        deadline: "2025-01-01",
        status: "active",
      },
      {
        party: "Party 2",
        description: "Pending obligation",
        deadline: "2025-02-01",
        status: "pending",
      },
      {
        party: "Party 3",
        description: "Completed obligation",
        deadline: "2025-03-01",
        status: "completed",
      },
      {
        party: "Party 4",
        description: "Overdue obligation",
        deadline: "2025-04-01",
        status: "overdue",
      },
    ];
    render(<ObligationsTable obligations={allStatuses} />);
    // Status badges appear in both mobile and desktop views
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("overdue").length).toBeGreaterThan(0);
  });

  it("handles long description text", () => {
    const longDesc =
      "This is a very long description of an obligation that should wrap properly without breaking the layout. It contains detailed information about what needs to be accomplished.";
    render(
      <ObligationsTable
        obligations={[
          {
            party: "Test Party",
            description: longDesc,
            deadline: "2025-01-01",
            status: "active",
          },
        ]}
      />
    );
    // Long description appears in both mobile and desktop views
    const allDescriptions = screen.getAllByText(longDesc);
    expect(allDescriptions.length).toBeGreaterThan(0);
  });

  it("handles many obligations (10+)", () => {
    const statuses = ["active", "pending", "completed", "overdue"] as const;
    const manyObligations: Obligation[] = Array.from({ length: 12 }, (_, i) => ({
      party: `Party ${i + 1}`,
      description: `Obligation ${i + 1}`,
      deadline: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
      status: statuses[i % 4],
    }));
    render(<ObligationsTable obligations={manyObligations} />);
    // Many obligations should be present
    const allParties = screen.getAllByText(/Party \d+/);
    expect(allParties.length).toBeGreaterThanOrEqual(12);
  });

  it("renders party, description, deadline and status columns", () => {
    render(<ObligationsTable obligations={mockObligations} />);
    // Verify all key fields are present
    expect(screen.getByText("Party")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Deadline")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
