import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  checkPerIpHourlyLimit,
  checkGlobalDailyLimit,
  resetRateLimiter,
} from "@/lib/rate-limit";

describe("Rate Limit - Phase 1: Enhanced Dual-Layer Protection", () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Per-IP Hourly Limit (3 requests per hour)", () => {
    it("should allow first 3 requests from same IP within an hour", () => {
      const ip = "192.168.1.1";

      for (let i = 0; i < 3; i++) {
        const result = checkPerIpHourlyLimit(ip, Date.now());
        expect(result.allowed).toBe(true);
        expect(result.limitType).toBe("per-ip");
        expect(result.remaining).toBe(2 - i);
      }
    });

    it("should block 4th request from same IP within hour window", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      // Use all 3 requests
      for (let i = 0; i < 3; i++) {
        const result = checkPerIpHourlyLimit(ip, now);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const blocked = checkPerIpHourlyLimit(ip, now);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.limitType).toBe("per-ip");
    });

    it("should return correct retryAfter seconds when blocked", () => {
      const ip = "192.168.1.1";
      const startTime = Date.now();

      // Use all 3 requests
      for (let i = 0; i < 3; i++) {
        checkPerIpHourlyLimit(ip, startTime);
      }

      // Check after 30 minutes
      const elapsedMs = 30 * 60 * 1000;
      const blocked = checkPerIpHourlyLimit(ip, startTime + elapsedMs);
      const remainingSeconds = blocked.retryAfter;

      // Should be approximately 30 minutes remaining (1800 seconds)
      expect(remainingSeconds).toBeGreaterThan(1790);
      expect(remainingSeconds).toBeLessThanOrEqual(1800);
    });

    it("should reset count after 1 hour window expires", () => {
      const ip = "192.168.1.1";
      const startTime = Date.now();

      // Use all 3 requests
      for (let i = 0; i < 3; i++) {
        checkPerIpHourlyLimit(ip, startTime);
      }

      // Verify blocked at hour mark
      const blocked = checkPerIpHourlyLimit(ip, startTime);
      expect(blocked.allowed).toBe(false);

      // Advance 1 hour + 1 second
      const newTime = startTime + 60 * 60 * 1000 + 1000;
      const result = checkPerIpHourlyLimit(ip, newTime);

      // Should be allowed with fresh count
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.retryAfter).toBe(0);
    });

    it("should isolate per-IP limits across different IPs", () => {
      const now = Date.now();

      // IP-A uses 3 requests
      for (let i = 0; i < 3; i++) {
        const result = checkPerIpHourlyLimit("10.0.0.1", now);
        expect(result.allowed).toBe(true);
      }

      // IP-B should have independent limit
      const resultB = checkPerIpHourlyLimit("10.0.0.2", now);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(2);

      // IP-A should be blocked
      const blockedA = checkPerIpHourlyLimit("10.0.0.1", now);
      expect(blockedA.allowed).toBe(false);

      // But IP-B should still be allowed
      const allowedB = checkPerIpHourlyLimit("10.0.0.2", now);
      expect(allowedB.allowed).toBe(true);
    });

    it("should return immutable result objects", () => {
      const ip = "192.168.1.1";
      const result = checkPerIpHourlyLimit(ip, Date.now());

      // Attempt to modify should fail
      expect(() => {
        (result as any).allowed = false;
      }).toThrow();
    });
  });

  describe("Global Daily Limit (50 requests per day)", () => {
    it("should allow first 50 requests across all IPs within a day", () => {
      const now = Date.now();

      // Make 50 requests from different IPs
      for (let i = 0; i < 50; i++) {
        const result = checkGlobalDailyLimit(now);
        expect(result.allowed).toBe(true);
        expect(result.limitType).toBe("global");
        expect(result.remaining).toBe(49 - i);
      }
    });

    it("should block 51st request regardless of IP", () => {
      const now = Date.now();

      // Use all 50 requests
      for (let i = 0; i < 50; i++) {
        checkGlobalDailyLimit(now);
      }

      // 51st should be blocked
      const blocked = checkGlobalDailyLimit(now);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.limitType).toBe("global");
    });

    it("should track global count independently of per-IP tracking", () => {
      const now = Date.now();

      // Use 50 global requests
      for (let i = 0; i < 50; i++) {
        checkGlobalDailyLimit(now);
      }

      // Global should be exhausted
      const globalBlocked = checkGlobalDailyLimit(now);
      expect(globalBlocked.allowed).toBe(false);

      // But per-IP from one IP should still be allowed
      const perIpAllowed = checkPerIpHourlyLimit("192.168.1.1", now);
      expect(perIpAllowed.allowed).toBe(true);
    });

    it("should return correct retryAfter seconds for daily reset", () => {
      const now = Date.now();

      // Use all 50 requests
      for (let i = 0; i < 50; i++) {
        checkGlobalDailyLimit(now);
      }

      // Check after 12 hours
      const elapsedMs = 12 * 60 * 60 * 1000;
      const blocked = checkGlobalDailyLimit(now + elapsedMs);

      // Should have approximately 12 hours remaining
      const remainingSeconds = blocked.retryAfter;
      expect(remainingSeconds).toBeGreaterThan(12 * 60 * 60 - 10);
      expect(remainingSeconds).toBeLessThanOrEqual(12 * 60 * 60);
    });

    it("should reset count after 24-hour window expires", () => {
      const startTime = Date.now();

      // Use all 50 requests
      for (let i = 0; i < 50; i++) {
        checkGlobalDailyLimit(startTime);
      }

      // Verify blocked
      const blocked = checkGlobalDailyLimit(startTime);
      expect(blocked.allowed).toBe(false);

      // Advance 24 hours + 1 second
      const newTime = startTime + 24 * 60 * 60 * 1000 + 1000;
      const result = checkGlobalDailyLimit(newTime);

      // Should be allowed with fresh count
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49);
      expect(result.retryAfter).toBe(0);
    });

    it("should return immutable result objects", () => {
      const result = checkGlobalDailyLimit(Date.now());

      expect(() => {
        (result as any).allowed = false;
      }).toThrow();
    });
  });

  describe("Combined checkRateLimit (Dual-Layer Protection)", () => {
    it("should allow requests when both limits are available", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      const result = checkRateLimit(ip, now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should return per-IP limit when per-IP is exhausted first", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      // Use all 3 per-IP requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, now);
      }

      // 4th request should fail with per-ip limitType
      const result = checkRateLimit(ip, now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("per-ip");
    });

    it("should return global limit when global is exhausted first", () => {
      const now = Date.now();

      // Use 50 global requests from different IPs
      for (let i = 0; i < 50; i++) {
        const ip = `192.168.1.${i}`;
        checkRateLimit(ip, now);
      }

      // 51st request should fail with global limitType
      const result = checkRateLimit("192.168.1.100", now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("global");
    });

    it("should return most restrictive limit when both are exhausted", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      // Use all 3 per-IP requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, now);
      }

      // Use all 50 global requests with different IPs
      for (let i = 0; i < 47; i++) {
        checkRateLimit(`192.168.2.${i}`, now);
      }

      // Next request should fail with per-ip (more restrictive)
      const result = checkRateLimit(ip, now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("per-ip");
    });

    it("should return global limitType when checking new IP against exhausted global", () => {
      const now = Date.now();

      // Use all 50 global requests
      for (let i = 0; i < 50; i++) {
        checkRateLimit(`192.168.1.${i}`, now);
      }

      // New IP should fail with global limitType
      const result = checkRateLimit("10.0.0.1", now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("global");
    });

    it("should correctly calculate remaining as minimum of both limits", () => {
      const now = Date.now();

      // Use 1 per-IP request from IP-A
      checkRateLimit("192.168.1.1", now);

      // Use 39 global requests from different IPs (not IP-A)
      for (let i = 0; i < 39; i++) {
        checkRateLimit(`192.168.1.${i + 10}`, now);
      }

      // State: global at 40/50 (10 remaining), IP-A at 1/3 (2 remaining)
      // New IP that hasn't been used yet
      // After this call: per-IP becomes 1 (remaining 2), global becomes 41 (remaining 9)
      // min(2, 9) = 2
      const result = checkRateLimit("192.168.2.1", now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("should handle rapid sequential calls from multiple IPs", () => {
      const now = Date.now();
      const ips = Array.from({ length: 10 }, (_, i) => `192.168.1.${i}`);

      // Each IP makes 5 requests (3 succeed per per-IP limit, 2 fail per-IP but still count globally)
      // Total: 10 IPs * 5 attempts = 50 global requests
      for (const ip of ips) {
        for (let i = 0; i < 5; i++) {
          const result = checkRateLimit(ip, now);
          if (i < 3) {
            expect(result.allowed).toBe(true);
          } else {
            expect(result.allowed).toBe(false);
            expect(result.limitType).toBe("per-ip");
          }
        }
      }

      // After 10 IPs * 5 attempts = 50 global requests, global limit is exhausted
      const newIp = "192.168.2.1";
      const result = checkRateLimit(newIp, now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("global");
    });

    it("should return immutable result objects", () => {
      const result = checkRateLimit("192.168.1.1", Date.now());

      expect(() => {
        (result as any).allowed = false;
      }).toThrow();
    });
  });

  describe("Type Discriminator (limitType field)", () => {
    it("should not set limitType when both limits allow", () => {
      const result = checkRateLimit("192.168.1.1", Date.now());
      expect(result.allowed).toBe(true);
      expect(result.limitType).toBeUndefined();
    });

    it("should set limitType to per-ip when per-IP limit hit", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, now);
      }

      const result = checkRateLimit(ip, now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("per-ip");
    });

    it("should set limitType to global when global limit hit", () => {
      const now = Date.now();

      for (let i = 0; i < 50; i++) {
        checkRateLimit(`192.168.1.${i}`, now);
      }

      const result = checkRateLimit("192.168.2.1", now);
      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe("global");
    });
  });

  describe("Immutability and Data Integrity", () => {
    it("should not allow modification of returned allowed flag", () => {
      const result = checkRateLimit("192.168.1.1", Date.now());
      expect(() => {
        (result as any).allowed = !result.allowed;
      }).toThrow();
    });

    it("should not allow modification of returned remaining count", () => {
      const result = checkRateLimit("192.168.1.1", Date.now());
      expect(() => {
        (result as any).remaining = 999;
      }).toThrow();
    });

    it("should not allow modification of returned retryAfter", () => {
      const result = checkRateLimit("192.168.1.1", Date.now());
      expect(() => {
        (result as any).retryAfter = 999;
      }).toThrow();
    });

    it("should not allow modification of returned limitType", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, now);
      }

      const result = checkRateLimit(ip, now);
      expect(() => {
        (result as any).limitType = "global";
      }).toThrow();
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle millisecond-precision timing boundaries", () => {
      const ip = "192.168.1.1";
      const startTime = 1000000000000; // Arbitrary timestamp

      // First request at t=0
      const result1 = checkPerIpHourlyLimit(ip, startTime);
      expect(result1.allowed).toBe(true);

      // Request at exactly 1 hour boundary should reset (>= HOUR_MS triggers reset)
      const hourMs = 60 * 60 * 1000;
      const result2 = checkPerIpHourlyLimit(ip, startTime + hourMs);
      expect(result2.allowed).toBe(true);

      // Request just before 1 hour should still be in window
      // Use all 3 requests first within the window
      checkPerIpHourlyLimit(ip, startTime);
      checkPerIpHourlyLimit(ip, startTime);
      const result3 = checkPerIpHourlyLimit(ip, startTime + hourMs - 1);
      expect(result3.allowed).toBe(false); // 4th request within hour window
    });

    it("should handle empty IP addresses gracefully", () => {
      const result = checkRateLimit("", Date.now());
      expect(result.allowed).toBe(true);
    });

    it("should handle various IP formats", () => {
      const ips = [
        "192.168.1.1",
        "10.0.0.1",
        "::1", // IPv6 loopback
        "fe80::1", // IPv6 link-local
        "2001:db8::1", // IPv6 documentation
      ];

      const now = Date.now();

      // Make first request from each IP
      for (const ip of ips) {
        const result = checkRateLimit(ip, now);
        expect(result.allowed).toBe(true);
      }

      // Make second request from each IP (5 IPs * 2 = 10 global)
      for (const ip of ips) {
        const result = checkRateLimit(ip, now);
        expect(result.allowed).toBe(true);
      }

      // Make third request from each IP (5 IPs * 3 = 15 global)
      for (const ip of ips) {
        const result = checkRateLimit(ip, now);
        expect(result.allowed).toBe(true);
      }

      // 4th request from each IP should be blocked by per-IP limit (3/hour)
      for (const ip of ips) {
        const result = checkRateLimit(ip, now);
        expect(result.allowed).toBe(false);
        expect(result.limitType).toBe("per-ip");
      }
    });

    it("should calculate retryAfter as integer seconds", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, now);
      }

      const result = checkRateLimit(ip, now);
      expect(Number.isInteger(result.retryAfter)).toBe(true);
    });

    it("should handle concurrent-like rapid calls correctly", () => {
      const ip = "192.168.1.1";
      const now = Date.now();

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit(ip, now));
      }

      // First 3 should be allowed
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);

      // 4th and 5th should be blocked
      expect(results[3].allowed).toBe(false);
      expect(results[4].allowed).toBe(false);
    });
  });
});
