import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExportButton } from "@/components/ExportButton";
import type { DocumentAnalysis } from "@/types";

const mockAnalysis: DocumentAnalysis = {
  summary: "Test summary",
  documentType: "contract",
  keyEntities: [
    { name: "Acme Corp", type: "organization", confidence: 0.95, context: "party" },
  ],
  keyDates: [
    { date: "2025-01-01", description: "Start date", importance: "high" },
  ],
  financialItems: [
    { description: "Payment", amount: 1000, currency: "USD", category: "payment" },
  ],
  obligations: [
    {
      party: "Acme Corp",
      description: "Deliver product",
      deadline: "2025-06-01",
      status: "active",
    },
  ],
  riskFlags: [
    { title: "Late penalty", description: "5% per day", severity: "high" },
  ],
  keyTerms: [
    { term: "SLA", definition: "Service Level Agreement", category: "general" },
  ],
  actionItems: ["Review terms"],
};

describe("ExportButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with download text", () => {
    render(<ExportButton data={mockAnalysis} />);
    expect(screen.getByRole("button", { name: /export json/i })).toBeInTheDocument();
  });

  it("triggers a JSON file download on click", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:test-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: clickSpy, href: "", download: "" } as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    render(<ExportButton data={mockAnalysis} />);
    await user.click(screen.getByRole("button", { name: /export json/i }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  it("generates valid JSON content", async () => {
    const user = userEvent.setup();
    let blobContent: string | undefined;

    const createObjectURL = vi.fn((blob: Blob) => {
      blob.text().then((text) => {
        blobContent = text;
      });
      return "blob:test-url";
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { click: vi.fn(), href: "", download: "" } as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    render(<ExportButton data={mockAnalysis} />);
    await user.click(screen.getByRole("button", { name: /export json/i }));

    await vi.waitFor(() => {
      expect(blobContent).toBeDefined();
    });

    const parsed = JSON.parse(blobContent!);
    expect(parsed.summary).toBe("Test summary");
    expect(parsed.documentType).toBe("contract");
  });

  it("sets the correct filename with .json extension", async () => {
    const user = userEvent.setup();
    let downloadFilename = "";

    const createObjectURL = vi.fn(() => "blob:test-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const anchor = {
          click: vi.fn(),
          href: "",
          _download: "",
        };
        Object.defineProperty(anchor, "download", {
          set(val: string) {
            anchor._download = val;
            downloadFilename = val;
          },
          get() {
            return anchor._download;
          },
        });
        return anchor as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    render(<ExportButton data={mockAnalysis} />);
    await user.click(screen.getByRole("button", { name: /export json/i }));

    expect(downloadFilename).toMatch(/^analysis-.*\.json$/);
  });

  it("is disabled when data is null", () => {
    render(<ExportButton data={null} />);
    expect(screen.getByRole("button", { name: /export json/i })).toBeDisabled();
  });
});
