import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import type { LoaderStep } from "@/components/AnalysisLoader";

describe("Phase 4.2: Loading Animation", () => {
  describe("Step 1: Uploading", () => {
    it('should show "Uploading PDF..." as active during uploading step', () => {
      render(<AnalysisLoader step="uploading" />);
      expect(screen.getByText(/uploading pdf/i)).toBeInTheDocument();
    });

    it("should show all 3 steps during uploading phase", () => {
      render(<AnalysisLoader step="uploading" />);

      // All steps should be visible
      expect(screen.getByText(/uploading pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/extracting text/i)).toBeInTheDocument();
      expect(screen.getByText(/analyzing document/i)).toBeInTheDocument();
    });

    it("should use spinner icon (Loader2) for active uploading step", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      // Active step should have animate-spin class
      const spinner = container.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeTruthy();
      expect(spinner).toHaveClass("text-blue-500");
    });

    it("should show extracting and analyzing as pending (gray) during upload", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      // Pending steps should have muted foreground color
      const mutedElements = container.querySelectorAll(
        '[class*="text-muted-foreground"]'
      );
      expect(mutedElements.length).toBeGreaterThan(0);
    });
  });

  describe("Step 2: Extracting", () => {
    it('should show "Extracting text..." as active during extracting step', () => {
      render(<AnalysisLoader step="extracting" />);
      expect(screen.getByText(/extracting text/i)).toBeInTheDocument();
    });

    it("should show uploading as completed (green checkmark) when extracting", () => {
      const { container } = render(<AnalysisLoader step="extracting" />);

      // Completed steps should have CheckCircle2 icon with green color
      const checkCircle = container.querySelector('[class*="text-green-500"]');
      expect(checkCircle).toBeTruthy();
    });

    it("should use spinner for active extracting step", () => {
      const { container } = render(<AnalysisLoader step="extracting" />);

      const spinner = container.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeTruthy();
      expect(spinner).toHaveClass("text-blue-500");
    });

    it("should show analyzing as pending (gray) when extracting", () => {
      render(<AnalysisLoader step="extracting" />);

      const analyzingText = screen.getByText(/analyzing document/i);
      expect(analyzingText).toHaveClass("text-muted-foreground");
    });
  });

  describe("Step 3: Analyzing", () => {
    it('should show "Analyzing document..." as active during analyzing step', () => {
      render(<AnalysisLoader step="analyzing" />);
      expect(screen.getByText(/analyzing document/i)).toBeInTheDocument();
    });

    it("should show uploading and extracting as completed (green) when analyzing", () => {
      const { container } = render(<AnalysisLoader step="analyzing" />);

      // Should have 2 completed steps (green checkmarks)
      const greenElements = container.querySelectorAll(
        '[class*="text-green-500"]'
      );
      expect(greenElements.length).toBe(2); // uploading and extracting completed
    });

    it("should use spinner for active analyzing step", () => {
      const { container } = render(<AnalysisLoader step="analyzing" />);

      const spinner = container.querySelector('[class*="animate-spin"]');
      expect(spinner).toBeTruthy();
      expect(spinner).toHaveClass("text-blue-500");
    });

    it("should show analyzing text in active state (not muted)", () => {
      render(<AnalysisLoader step="analyzing" />);

      const analyzingText = screen.getByText(/analyzing document/i);
      expect(analyzingText).toHaveClass("font-medium");
      expect(analyzingText).toHaveClass("text-foreground");
    });
  });

  describe("Visual States", () => {
    it("should render all 3 steps in correct order", () => {
      render(<AnalysisLoader step="uploading" />);

      const allText = screen.getAllByText(/uploading|extracting|analyzing/i);
      expect(allText).toHaveLength(3);
    });

    it("should differentiate completed, active, and pending steps visually", () => {
      const { container } = render(<AnalysisLoader step="extracting" />);

      // Should have all three states
      const greenIcons = container.querySelectorAll('[class*="text-green-500"]'); // completed
      const blueIcons = container.querySelectorAll('[class*="text-blue-500"]'); // active
      const grayIcons = container.querySelectorAll(
        '[class*="text-muted-foreground"]'
      ); // pending

      expect(greenIcons.length).toBe(1); // uploading completed
      expect(blueIcons.length).toBe(1); // extracting active
      expect(grayIcons.length).toBeGreaterThan(0); // analyzing pending
    });

    it("should use different icons for different states", () => {
      const { container } = render(<AnalysisLoader step="extracting" />);

      // Should have exactly 3 different icons (one per step)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBe(3);

      // Should have CheckCircle2 for completed (green color)
      const greenIcon = container.querySelector('[class*="text-green-500"]');
      expect(greenIcon).toBeTruthy();
      expect(greenIcon?.tagName).toBe("svg");

      // Should have Loader2 spinning for active (blue + spin)
      const blueSpinner = container.querySelector(
        '[class*="text-blue-500"][class*="animate-spin"]'
      );
      expect(blueSpinner).toBeTruthy();
      expect(blueSpinner?.tagName).toBe("svg");

      // Should have Circle for pending (muted color)
      const grayIcon = container.querySelector(
        'svg[class*="text-muted-foreground"]'
      );
      expect(grayIcon).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have role='status' for screen readers", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toBeTruthy();
    });

    it("should have visible text for all steps", () => {
      render(<AnalysisLoader step="uploading" />);

      const uploadingText = screen.getByText(/uploading pdf/i);
      const extractingText = screen.getByText(/extracting text/i);
      const analyzingText = screen.getByText(/analyzing document/i);

      expect(uploadingText).toBeVisible();
      expect(extractingText).toBeVisible();
      expect(analyzingText).toBeVisible();
    });

    it("should render text content for screen readers", () => {
      render(<AnalysisLoader step="analyzing" />);

      // All step labels should be present in DOM for screen readers
      expect(screen.getByText(/uploading pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/extracting text/i)).toBeInTheDocument();
      expect(screen.getByText(/analyzing document/i)).toBeInTheDocument();
    });
  });

  describe("Icons and Animation", () => {
    it("should render exactly 3 icons (one per step)", () => {
      const { container } = render(<AnalysisLoader step="extracting" />);

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBe(3);
    });

    it("should animate spinner (Loader2) for active step only", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      const spinners = container.querySelectorAll('[class*="animate-spin"]');
      expect(spinners.length).toBe(1); // Only active step spins
    });

    it("should use blue color for active step", () => {
      const { container } = render(<AnalysisLoader step="analyzing" />);

      const blueIcons = container.querySelectorAll('[class*="text-blue-500"]');
      expect(blueIcons.length).toBe(1); // Only active step is blue
    });

    it("should use green color for completed steps", () => {
      const { container } = render(<AnalysisLoader step="analyzing" />);

      const greenIcons = container.querySelectorAll(
        '[class*="text-green-500"]'
      );
      expect(greenIcons.length).toBe(2); // uploading and extracting completed
    });
  });

  describe("Step Data Attributes", () => {
    it("should set data-testid='step-active' for current step", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      const activeStep = container.querySelector('[data-testid="step-active"]');
      expect(activeStep).toBeTruthy();
      expect(activeStep?.textContent).toContain("Uploading PDF");
    });

    it("should set data-testid='step-complete' for finished steps", () => {
      const { container } = render(<AnalysisLoader step="analyzing" />);

      const completeSteps = container.querySelectorAll(
        '[data-testid="step-complete"]'
      );
      expect(completeSteps.length).toBe(2); // uploading and extracting
    });

    it("should set data-testid='step-pending' for future steps", () => {
      const { container } = render(<AnalysisLoader step="uploading" />);

      const pendingSteps = container.querySelectorAll(
        '[data-testid="step-pending"]'
      );
      expect(pendingSteps.length).toBe(2); // extracting and analyzing
    });
  });
});
