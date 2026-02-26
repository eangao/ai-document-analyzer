import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, resetRateLimiter } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow requests under the limit", () => {
      const result = checkRateLimit("192.168.1.1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should track requests per IP independently", () => {
      // Use 3 requests from IP-A
      checkRateLimit("10.0.0.1");
      checkRateLimit("10.0.0.1");
      checkRateLimit("10.0.0.1");

      // IP-B should still have full allowance
      const resultB = checkRateLimit("10.0.0.2");
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(4);

      // IP-A should have 2 remaining
      const resultA = checkRateLimit("10.0.0.1");
      expect(resultA.allowed).toBe(true);
      expect(resultA.remaining).toBe(1);
    });

    it("should block requests when limit is exceeded", () => {
      const ip = "192.168.1.100";

      // Use all 5 requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blocked = checkRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it("should reset the window after 1 minute", () => {
      const ip = "192.168.1.200";

      // Use all 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip);
      }

      // Should be blocked
      expect(checkRateLimit(ip).allowed).toBe(false);

      // Advance time by 61 seconds (past the 1-minute window)
      vi.advanceTimersByTime(61_000);

      // Should be allowed again
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should return retryAfter in seconds when blocked", () => {
      const ip = "10.0.0.50";

      // Use all 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip);
      }

      // Advance 30 seconds
      vi.advanceTimersByTime(30_000);

      const blocked = checkRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.retryAfter).toBeLessThanOrEqual(30);
    });

    it("should correctly decrement remaining count", () => {
      const ip = "172.16.0.1";

      expect(checkRateLimit(ip).remaining).toBe(4);
      expect(checkRateLimit(ip).remaining).toBe(3);
      expect(checkRateLimit(ip).remaining).toBe(2);
      expect(checkRateLimit(ip).remaining).toBe(1);
      expect(checkRateLimit(ip).remaining).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should evict entries older than 2 hours during cleanup", () => {
      const ip = "192.168.50.1";

      // Make a request
      checkRateLimit(ip);

      // Advance past 2 hours + cleanup interval (5 min)
      vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 5 * 60 * 1000 + 1000);

      // After cleanup, IP should have fresh allowance
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });
});
