import { describe, it, expect } from "vitest";
import {
  generateRateLimitError,
  formatRetryTime,
  getDayResetTime,
} from "@/lib/error-messages";

describe("Error Messages - Graceful Rate Limit Handling", () => {
  describe("formatRetryTime", () => {
    it("should format 0 seconds correctly", () => {
      const result = formatRetryTime(0);
      expect(result).toBe("0 seconds");
    });

    it("should format single second", () => {
      const result = formatRetryTime(1);
      expect(result).toBe("1 second");
    });

    it("should format multiple seconds", () => {
      const result = formatRetryTime(45);
      expect(result).toBe("45 seconds");
    });

    it("should format single minute", () => {
      const result = formatRetryTime(60);
      expect(result).toBe("1 minute");
    });

    it("should format multiple minutes", () => {
      const result = formatRetryTime(5 * 60);
      expect(result).toBe("5 minutes");
    });

    it("should format single hour", () => {
      const result = formatRetryTime(60 * 60);
      expect(result).toBe("1 hour");
    });

    it("should format multiple hours", () => {
      const result = formatRetryTime(2.5 * 60 * 60);
      expect(result).toBe("2 hours");
    });

    it("should format nearly 24 hours", () => {
      const result = formatRetryTime(23 * 60 * 60 + 59 * 60 + 59);
      expect(result).toBe("23 hours");
    });

    it("should handle edge case of 59 seconds", () => {
      const result = formatRetryTime(59);
      expect(result).toBe("59 seconds");
    });

    it("should handle edge case of 61 seconds (rounds to minutes)", () => {
      const result = formatRetryTime(61);
      expect(result).toBe("1 minute");
    });

    it("should handle large values (multiple days in seconds)", () => {
      const result = formatRetryTime(50 * 60 * 60); // 50 hours
      expect(result).toBe("50 hours");
    });
  });

  describe("getDayResetTime", () => {
    it("should return a string", () => {
      const result = getDayResetTime();
      expect(typeof result).toBe("string");
    });

    it("should mention 'UTC' or 'midnight'", () => {
      const result = getDayResetTime();
      expect(result.toLowerCase()).toMatch(/utc|midnight/);
    });

    it("should return a reasonable length message (not too short, not too long)", () => {
      const result = getDayResetTime();
      expect(result.length).toBeGreaterThan(10);
      expect(result.length).toBeLessThan(200);
    });

    it("should return consistent formatting", () => {
      const result1 = getDayResetTime();
      const result2 = getDayResetTime();
      // Both should be similar format (may differ by timezone offset)
      expect(result1).toMatch(/\d+:/); // Contains time
    });

    it("should include next day reference", () => {
      const result = getDayResetTime();
      expect(result.toLowerCase()).toMatch(/tomorrow|next/i);
    });
  });

  describe("generateRateLimitError - Per-IP Limit", () => {
    it("should return object with required fields", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("demoNote");
    });

    it("should have demoNote set to true", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.demoNote).toBe(true);
    });

    it("should include '3 documents per hour' or similar limit description", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message.toLowerCase()).toMatch(/3.*(?:documents|requests|analyses).*(?:hour|per)/i);
    });

    it("should include retry time in message", () => {
      const result = generateRateLimitError("per-ip", 120);
      expect(result.message).toMatch(/120|2 minute/i);
    });

    it("should be professional and non-blaming tone", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message.toLowerCase()).not.toMatch(/error|fail|stop/);
      expect(result.message).toMatch(/thanks|please|understand/i);
    });

    it("should include portfolio/demo context", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message.toLowerCase()).toMatch(/demo|portfolio|this.*sustainable|prevent.*cost/i);
    });

    it("should include suggestion for user action", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message.toLowerCase()).toMatch(/try.*different|while.*wait|explore|source/i);
    });

    it("should have description field matching limit", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.description.toLowerCase()).toMatch(/3.*(?:documents|per).*hour/i);
    });

    it("should handle various retry times", () => {
      const times = [0, 30, 60, 300, 3600];
      for (const time of times) {
        const result = generateRateLimitError("per-ip", time);
        expect(result.message).toBeTruthy();
        expect(result.message.length).toBeGreaterThan(20);
      }
    });

    it("should return immutable result", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(() => {
        (result as any).message = "changed";
      }).toThrow();
    });
  });

  describe("generateRateLimitError - Global Limit", () => {
    it("should return object with required fields", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("demoNote");
    });

    it("should have demoNote set to true", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.demoNote).toBe(true);
    });

    it("should include '50 documents per day' or similar limit description", () => {
      const result = generateRateLimitError("global", 82800);
      const lowerMsg = result.message.toLowerCase();
      // Check for 50 and some variant of analyses/documents combined with daily
      expect(lowerMsg).toMatch(/50/);
      expect(lowerMsg).toMatch(/(?:analyses|documents|requests)/);
      expect(lowerMsg).toMatch(/daily|per day/);
    });

    it("should mention 'high traffic' or 'service-wide'", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message.toLowerCase()).toMatch(/(?:high|traffic|service|popular|shared)/i);
    });

    it("should include call-to-action for deploying own version", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message.toLowerCase()).toMatch(/(?:deploy|build|your own|source.*code|github)/i);
    });

    it("should be celebratory or positive in tone", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message.toLowerCase()).not.toMatch(/apologize|sorry|unfortunate/);
      expect(result.message).toMatch(/thanks|interest|popular/i);
    });

    it("should include portfolio/demo context", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message.toLowerCase()).toMatch(/demo|free|portfolio/i);
    });

    it("should have description field matching limit", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.description.toLowerCase()).toMatch(/50.*(?:documents|requests).*day/i);
    });

    it("should mention 'tomorrow' or reset time", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message.toLowerCase()).toMatch(/tomorrow|reset|(?:try.*again)/i);
    });

    it("should return immutable result", () => {
      const result = generateRateLimitError("global", 82800);
      expect(() => {
        (result as any).message = "changed";
      }).toThrow();
    });
  });

  describe("Error Message Consistency", () => {
    it("should have similar message lengths for same limit type", () => {
      const result1 = generateRateLimitError("per-ip", 300);
      const result2 = generateRateLimitError("per-ip", 1800);
      expect(result1.message.length).toBeGreaterThan(50);
      expect(result2.message.length).toBeGreaterThan(50);
    });

    it("should have different messages for different limit types", () => {
      const perIp = generateRateLimitError("per-ip", 300);
      const global = generateRateLimitError("global", 82800);
      expect(perIp.message).not.toBe(global.message);
    });

    it("should include numbers in both limit types", () => {
      const perIp = generateRateLimitError("per-ip", 300);
      const global = generateRateLimitError("global", 82800);
      expect(perIp.message).toMatch(/\d/);
      expect(global.message).toMatch(/\d/);
    });

    it("should be professional across both types", () => {
      const perIp = generateRateLimitError("per-ip", 300);
      const global = generateRateLimitError("global", 82800);
      expect(perIp.message).toMatch(/[A-Z]/); // Proper capitalization
      expect(global.message).toMatch(/[A-Z]/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small retry times (0-10 seconds)", () => {
      const result = generateRateLimitError("per-ip", 5);
      expect(result.message).toContain("5 seconds");
    });

    it("should handle very large retry times (24+ hours)", () => {
      const seconds = 48 * 60 * 60; // 48 hours
      const result = generateRateLimitError("global", seconds);
      expect(result.message).toBeTruthy();
    });

    it("should handle exactly 1 hour retry time", () => {
      const result = generateRateLimitError("per-ip", 3600);
      expect(result.message).toMatch(/1 hour/i);
    });

    it("should handle exactly 1 minute retry time", () => {
      const result = generateRateLimitError("per-ip", 60);
      expect(result.message).toMatch(/1 minute/i);
    });

    it("should handle boundary between minutes and hours", () => {
      const result59min = generateRateLimitError("per-ip", 59 * 60);
      const result61min = generateRateLimitError("per-ip", 61 * 60);
      expect(result59min.message).toMatch(/59 minutes/i);
      expect(result61min.message).toMatch(/1 hour/i);
    });
  });

  describe("Type Safety", () => {
    it("should accept only valid limit types", () => {
      // This would fail at type-check time in TypeScript, but runtime should work
      const perIp = generateRateLimitError("per-ip", 300);
      const global = generateRateLimitError("global", 300);
      expect(perIp).toBeTruthy();
      expect(global).toBeTruthy();
    });

    it("should return object with correct readonly properties", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe("No Typos or Grammar Issues", () => {
    it("should not have double spaces in per-IP message", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message).not.toMatch(/  /);
    });

    it("should not have double spaces in global message", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message).not.toMatch(/  /);
    });

    it("should not have trailing/leading whitespace in per-IP message", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message).toBe(result.message.trim());
    });

    it("should not have trailing/leading whitespace in global message", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message).toBe(result.message.trim());
    });

    it("per-IP message should end with punctuation", () => {
      const result = generateRateLimitError("per-ip", 300);
      expect(result.message).toMatch(/[.!?]$/);
    });

    it("global message should end with punctuation", () => {
      const result = generateRateLimitError("global", 82800);
      expect(result.message).toMatch(/[.!?]$/);
    });
  });
});
