import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RiskFlags } from "@/components/dashboard/RiskFlags";
import type { RiskFlag } from "@/types";

describe("RiskFlags", () => {
  const mockHighRisk: RiskFlag = {
    title: "Late payment penalty",
    description: "5% penalty per day after deadline",
    severity: "high",
  };

  const mockMediumRisk: RiskFlag = {
    title: "Termination clause",
    description: "Either party can terminate with 30 days notice",
    severity: "medium",
  };

  const mockLowRisk: RiskFlag = {
    title: "Extension clause",
    description: "Contract can be extended by mutual agreement",
    severity: "low",
  };

  it("renders risk flags with titles and descriptions", () => {
    const risks = [mockHighRisk];
    render(<RiskFlags risks={risks} />);
    expect(screen.getByText("Late payment penalty")).toBeInTheDocument();
    expect(screen.getByText("5% penalty per day after deadline")).toBeInTheDocument();
  });

  it("renders high severity risk with destructive variant", () => {
    const { container } = render(<RiskFlags risks={[mockHighRisk]} />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-red-500");
  });

  it("renders medium severity risk with warning variant", () => {
    const { container } = render(<RiskFlags risks={[mockMediumRisk]} />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-yellow-500");
  });

  it("renders low severity risk with default variant", () => {
    const { container } = render(<RiskFlags risks={[mockLowRisk]} />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("border-blue-500");
  });

  it("renders multiple risk flags", () => {
    const risks = [mockHighRisk, mockMediumRisk, mockLowRisk];
    const { container } = render(<RiskFlags risks={risks} />);
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBe(3);
  });

  it("shows empty state when risks array is empty", () => {
    render(<RiskFlags risks={[]} />);
    expect(
      screen.getByText(/no risk flags identified/i)
    ).toBeInTheDocument();
  });

  it("renders Card component wrapper", () => {
    const { container } = render(<RiskFlags risks={[mockHighRisk]} />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
  });

  it("renders all severity levels correctly", () => {
    const risks = [
      { ...mockHighRisk, title: "High Risk" },
      { ...mockMediumRisk, title: "Medium Risk" },
      { ...mockLowRisk, title: "Low Risk" },
    ];
    render(<RiskFlags risks={risks} />);
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
  });

  it("handles multiple high severity risks", () => {
    const risks = [mockHighRisk, { ...mockHighRisk, title: "Another high risk" }];
    const { container } = render(<RiskFlags risks={risks} />);
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBe(2);
    alerts.forEach((alert) => {
      expect(alert).toHaveClass("border-red-500");
    });
  });

  it("renders CardHeader with title", () => {
    render(<RiskFlags risks={[mockHighRisk]} />);
    expect(screen.getByText("Risk Flags")).toBeInTheDocument();
  });

  it("maintains semantic HTML structure with alerts", () => {
    const risks = [mockHighRisk, mockMediumRisk];
    const { container } = render(<RiskFlags risks={risks} />);
    const alerts = container.querySelectorAll('[role="alert"]');
    alerts.forEach((alert) => {
      // Each alert should have title and description
      expect(alert.children.length).toBeGreaterThan(0);
    });
  });
});
