import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActionItems } from "@/components/dashboard/ActionItems";

describe("ActionItems", () => {
  it("renders action items with checklist style", () => {
    const items = ["Review contract terms", "Sign documents"];
    render(<ActionItems items={items} />);
    expect(screen.getByText("Review contract terms")).toBeInTheDocument();
    expect(screen.getByText("Sign documents")).toBeInTheDocument();
  });

  it("renders CircleCheck icons for each item", () => {
    const items = ["Task 1", "Task 2"];
    const { container } = render(<ActionItems items={items} />);
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when items array is empty", () => {
    render(<ActionItems items={[]} />);
    expect(
      screen.getByText(/no action items/i)
    ).toBeInTheDocument();
  });

  it("renders Card component wrapper", () => {
    const items = ["Task 1"];
    const { container } = render(<ActionItems items={items} />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
  });

  it("renders CardHeader with title", () => {
    const items = ["Task 1"];
    render(<ActionItems items={items} />);
    expect(screen.getByText("Action Items")).toBeInTheDocument();
  });

  it("handles single action item", () => {
    const items = ["Single action"];
    render(<ActionItems items={items} />);
    expect(screen.getByText("Single action")).toBeInTheDocument();
  });

  it("handles multiple action items (10+)", () => {
    const items = Array.from({ length: 15 }, (_, i) => `Action ${i + 1}`);
    render(<ActionItems items={items} />);
    expect(screen.getByText("Action 1")).toBeInTheDocument();
    expect(screen.getByText("Action 15")).toBeInTheDocument();
  });

  it("renders list items in order", () => {
    const items = ["First", "Second", "Third"];
    const { container } = render(<ActionItems items={items} />);
    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBeGreaterThanOrEqual(3);
    expect(listItems[0]).toHaveTextContent("First");
    expect(listItems[1]).toHaveTextContent("Second");
    expect(listItems[2]).toHaveTextContent("Third");
  });

  it("displays correct text styling for action items", () => {
    const items = ["Test action"];
    render(<ActionItems items={items} />);
    const text = screen.getByText("Test action");
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass("text-sm");
  });
});
