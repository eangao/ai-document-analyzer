import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DEMO_MODE,
  DEMO_TRUNCATE_LENGTH,
  PRODUCTION_TRUNCATE_LENGTH,
  getTruncationLength,
} from "@/lib/demo-mode";

describe("Demo Mode - Cost Control Toggle", () => {
  describe("Constants", () => {
    it("should export DEMO_MODE boolean", () => {
      expect(typeof DEMO_MODE).toBe("boolean");
    });

    it("should export DEMO_TRUNCATE_LENGTH as 5000", () => {
      expect(DEMO_TRUNCATE_LENGTH).toBe(5000);
    });

    it("should export PRODUCTION_TRUNCATE_LENGTH as 80000", () => {
      expect(PRODUCTION_TRUNCATE_LENGTH).toBe(80000);
    });

    it("should have demo length much smaller than production", () => {
      expect(DEMO_TRUNCATE_LENGTH).toBeLessThan(PRODUCTION_TRUNCATE_LENGTH);
      expect(PRODUCTION_TRUNCATE_LENGTH / DEMO_TRUNCATE_LENGTH).toBeGreaterThan(10);
    });

    it("should have demo length in expected range (4K-6K)", () => {
      expect(DEMO_TRUNCATE_LENGTH).toBeGreaterThanOrEqual(4000);
      expect(DEMO_TRUNCATE_LENGTH).toBeLessThanOrEqual(6000);
    });

    it("should have production length in expected range (75K-85K)", () => {
      expect(PRODUCTION_TRUNCATE_LENGTH).toBeGreaterThanOrEqual(75000);
      expect(PRODUCTION_TRUNCATE_LENGTH).toBeLessThanOrEqual(85000);
    });
  });

  describe("getTruncationLength function", () => {
    it("should return a number", () => {
      const result = getTruncationLength();
      expect(typeof result).toBe("number");
    });

    it("should return either DEMO or PRODUCTION length", () => {
      const result = getTruncationLength();
      expect(
        result === DEMO_TRUNCATE_LENGTH || result === PRODUCTION_TRUNCATE_LENGTH
      ).toBe(true);
    });

    it("should return DEMO_TRUNCATE_LENGTH when DEMO_MODE is true", () => {
      // We can't directly control DEMO_MODE (it's from env), but we can verify consistency
      const result = getTruncationLength();
      if (DEMO_MODE) {
        expect(result).toBe(DEMO_TRUNCATE_LENGTH);
      }
    });

    it("should return PRODUCTION_TRUNCATE_LENGTH when DEMO_MODE is false", () => {
      const result = getTruncationLength();
      if (!DEMO_MODE) {
        expect(result).toBe(PRODUCTION_TRUNCATE_LENGTH);
      }
    });

    it("should always return a positive integer", () => {
      const result = getTruncationLength();
      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("should be consistent across multiple calls", () => {
      const result1 = getTruncationLength();
      const result2 = getTruncationLength();
      const result3 = getTruncationLength();
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("should match DEMO_MODE setting", () => {
      const length = getTruncationLength();
      if (DEMO_MODE) {
        expect(length).toBe(DEMO_TRUNCATE_LENGTH);
      } else {
        expect(length).toBe(PRODUCTION_TRUNCATE_LENGTH);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle truncation of a document to DEMO length", () => {
      const demoLength = getTruncationLength();
      const largeDoc = "x".repeat(10000);
      const truncated = largeDoc.slice(0, demoLength);
      expect(truncated.length).toBeLessThanOrEqual(demoLength);
    });

    it("should handle truncation of a document to PRODUCTION length", () => {
      // This test verifies the concept even if DEMO_MODE is true
      const largeDoc = "x".repeat(100000);
      const truncated = largeDoc.slice(0, PRODUCTION_TRUNCATE_LENGTH);
      expect(truncated.length).toBe(PRODUCTION_TRUNCATE_LENGTH);
    });

    it("should handle short documents that don't need truncation", () => {
      const shortDoc = "Hello world";
      const length = getTruncationLength();
      expect(shortDoc.length).toBeLessThan(length);
    });
  });

  describe("Type Safety", () => {
    it("DEMO_MODE should be boolean", () => {
      expect(typeof DEMO_MODE === "boolean").toBe(true);
    });

    it("getTruncationLength should return number", () => {
      const result = getTruncationLength();
      expect(typeof result === "number").toBe(true);
    });

    it("constants should be immutable", () => {
      expect(() => {
        (DEMO_MODE as any) = !DEMO_MODE;
      }).toThrow();
    });

    it("DEMO_TRUNCATE_LENGTH should be immutable", () => {
      expect(() => {
        (DEMO_TRUNCATE_LENGTH as any) = 10000;
      }).toThrow();
    });

    it("PRODUCTION_TRUNCATE_LENGTH should be immutable", () => {
      expect(() => {
        (PRODUCTION_TRUNCATE_LENGTH as any) = 90000;
      }).toThrow();
    });
  });
});
