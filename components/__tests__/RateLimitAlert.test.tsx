import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RateLimitAlert } from "@/components/RateLimitAlert";

describe("RateLimitAlert", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Per-IP Rate Limit Alert", () => {
    it("should render per-IP rate limit message", () => {
      render(<RateLimitAlert limitType="per-ip" retryAfterSeconds={300} />);

      expect(
        screen.getByText(/reached.*personal.*request.*limit/i)
      ).toBeInTheDocument();
    });

    it("should display initial countdown in MM:SS format", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={180} />
      );

      // Check that the time is rendered somewhere in the component
      expect(container.textContent).toMatch(/3:00/);
    });

    it("should display Clock icon for per-IP alerts", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      const clockIcon = container.querySelector("svg");
      expect(clockIcon).toBeInTheDocument();
    });

    it("should apply amber/yellow styling for per-IP", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveClass("bg-amber-50");
      expect(alert).toHaveClass("border-amber-200");
    });

    it("should format large timeouts correctly (1+ hour)", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={3661} />
      );

      // Text may be split across elements, check via container
      expect(container.textContent).toMatch(/61:01/);
    });

    it("should be mobile responsive", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveClass("p-4");
    });

    it("should include helpful description text", () => {
      render(<RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />);

      expect(
        screen.getByText(/please wait/i)
      ).toBeInTheDocument();
    });

    it("should handle zero seconds gracefully", () => {
      render(<RateLimitAlert limitType="per-ip" retryAfterSeconds={0} />);

      expect(screen.getByText(/ready to retry/i)).toBeInTheDocument();
    });

    it("should call onRetryReady immediately for zero seconds", () => {
      const onRetryReady = vi.fn();

      render(
        <RateLimitAlert
          limitType="per-ip"
          retryAfterSeconds={0}
          onRetryReady={onRetryReady}
        />
      );

      expect(onRetryReady).toHaveBeenCalledTimes(1);
    });
  });

  describe("Global Rate Limit Alert", () => {
    it("should render global rate limit message", () => {
      render(<RateLimitAlert limitType="global" retryAfterSeconds={3600} />);

      expect(
        screen.getByText(/demo.*experiencing.*high.*traffic/i)
      ).toBeInTheDocument();
    });

    it("should display initial countdown for global", () => {
      const { container } = render(
        <RateLimitAlert limitType="global" retryAfterSeconds={7200} />
      );

      expect(container.textContent).toMatch(/120:00/);
    });

    it("should display Globe icon for global alerts", () => {
      const { container } = render(
        <RateLimitAlert limitType="global" retryAfterSeconds={3600} />
      );

      const globeIcon = container.querySelector("svg");
      expect(globeIcon).toBeInTheDocument();
    });

    it("should apply blue styling for global", () => {
      const { container } = render(
        <RateLimitAlert limitType="global" retryAfterSeconds={3600} />
      );

      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveClass("bg-blue-50");
      expect(alert).toHaveClass("border-blue-200");
    });

    it("should include global-specific description", () => {
      render(
        <RateLimitAlert limitType="global" retryAfterSeconds={3600} />
      );

      expect(
        screen.getByText(/come.*back.*later/i)
      ).toBeInTheDocument();
    });
  });

  describe("Timer Management", () => {
    it("should cleanup interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { unmount } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it("should handle missing onRetryReady callback", () => {
      // Should render without errors
      render(<RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />);

      expect(
        screen.getByText(/reached.*personal.*request.*limit/i)
      ).toBeInTheDocument();
    });

    it("should reset timer when retryAfterSeconds prop changes", () => {
      const { rerender, container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={10} />
      );

      expect(container.textContent).toMatch(/0:10/);

      rerender(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={20} />
      );

      expect(container.textContent).toMatch(/0:20/);
    });
  });

  describe("Time Formatting", () => {
    it("should format MM:SS correctly for 65 seconds", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={65} />
      );

      expect(container.textContent).toMatch(/1:05/);
    });

    it("should format MM:SS correctly for 125 seconds", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={125} />
      );

      expect(container.textContent).toMatch(/2:05/);
    });

    it("should format MM:SS correctly for 3661 seconds", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={3661} />
      );

      // Text may be split across elements, check via container
      expect(container.textContent).toMatch(/61:01/);
    });

    it("should handle very large timeouts (24+ hours)", () => {
      const oneDay = 86400;
      const { container } = render(
        <RateLimitAlert limitType="global" retryAfterSeconds={oneDay} />
      );

      expect(container.textContent).toMatch(/1440:00/);
    });

    it("should pad single digit seconds with zero", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={61} />
      );

      expect(container.textContent).toMatch(/1:01/);
    });

    it("should show single digit minutes without padding", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={305} />
      );

      expect(container.textContent).toMatch(/5:05/);
    });
  });

  describe("Accessibility", () => {
    it("should have role='alert' for screen readers", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      expect(container.querySelector("[role='alert']")).toBeInTheDocument();
    });

    it("should have descriptive aria-live region", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("should render icon for visual indicator", () => {
      const { container } = render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Message Content", () => {
    it("should display per-IP specific title", () => {
      render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      expect(
        screen.getByText(/you've reached.*personal.*request.*limit/i)
      ).toBeInTheDocument();
    });

    it("should display global specific title", () => {
      render(
        <RateLimitAlert limitType="global" retryAfterSeconds={3600} />
      );

      expect(
        screen.getByText(/this demo.*experiencing.*high.*traffic/i)
      ).toBeInTheDocument();
    });

    it("should display time remaining label", () => {
      render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={60} />
      );

      expect(
        screen.getByText(/time remaining/i)
      ).toBeInTheDocument();
    });

    it("should display ready message at zero seconds", () => {
      render(
        <RateLimitAlert limitType="per-ip" retryAfterSeconds={0} />
      );

      expect(
        screen.getByText(/ready to retry/i)
      ).toBeInTheDocument();
    });
  });
});
