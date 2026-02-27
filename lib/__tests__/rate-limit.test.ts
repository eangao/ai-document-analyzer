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
    it("should allow requests under the new hourly limit", () => {
      const result = checkRateLimit("192.168.1.1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.limitType).toBeUndefined();
    });

    it("should track requests per IP independently with hourly limit", () => {
      // Use 3 requests from IP-A (hits per-IP hourly limit)
      checkRateLimit("10.0.0.1");
      checkRateLimit("10.0.0.1");
      checkRateLimit("10.0.0.1");

      // IP-B should still have full allowance
      const resultB = checkRateLimit("10.0.0.2");
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBeGreaterThan(0);

      // IP-A should be blocked (exceeded 3/hour limit)
      const resultA = checkRateLimit("10.0.0.1");
      expect(resultA.allowed).toBe(false);
      expect(resultA.limitType).toBe("per-ip");
    });

    it("should block requests when per-IP limit is exceeded", () => {
      const ip = "192.168.1.100";

      // Use all 3 requests (new per-IP hourly limit)
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const blocked = checkRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.limitType).toBe("per-ip");
    });

    it("should reset the window after 1 hour", () => {
      const ip = "192.168.1.200";

      // Use all 3 requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip);
      }

      // Should be blocked
      expect(checkRateLimit(ip).allowed).toBe(false);

      // Advance time by 1 hour + 1 second
      vi.advanceTimersByTime(60 * 60 * 1000 + 1000);

      // Should be allowed again
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should return retryAfter in seconds when blocked", () => {
      const ip = "10.0.0.50";

      // Use all 3 requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip);
      }

      // Advance 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      const blocked = checkRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.limitType).toBe("per-ip");
    });

    it("should correctly decrement remaining count", () => {
      const ip = "172.16.0.1";

      const r1 = checkRateLimit(ip);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(ip);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(ip);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(ip);
      expect(r4.allowed).toBe(false);
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
      expect(result.remaining).toBe(2); // 3 per-hour limit, 1 used = 2 remaining
    });
  });
});
