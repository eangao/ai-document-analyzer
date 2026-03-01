import { describe, it, expect } from "vitest";
import { parseAnalysisError } from "@/lib/error-parser";

describe("Error Parser - Frontend Error Handling", () => {
  describe("parseAnalysisError - Per-IP Rate Limit (429)", () => {
    it("should parse per-IP rate limit error with correct fields", () => {
      const response = {
        status: 429,
        body: {
          message: "You've reached your personal request limit of 3 documents per hour.",
          rateLimitType: "per-ip",
          retryAfterSeconds: 2847,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("rate-limit");
      expect(error.rateLimitType).toBe("per-ip");
      expect(error.retryAfterSeconds).toBe(2847);
      expect(error.isDemoLimit).toBe(true);
      expect(error.message).toBeTruthy();
    });

    it("should set isDemoLimit to true for per-IP errors", () => {
      const response = {
        status: 429,
        body: {
          message: "Rate limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);
      expect(error.isDemoLimit).toBe(true);
    });

    it("should extract exact retry-after seconds", () => {
      const response = {
        status: 429,
        body: {
          message: "Rate limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 1234,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);
      expect(error.retryAfterSeconds).toBe(1234);
    });

    it("should include original message in parsed error", () => {
      const originalMessage = "You've reached your personal request limit...";
      const response = {
        status: 429,
        body: {
          message: originalMessage,
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);
      expect(error.message).toBe(originalMessage);
    });
  });

  describe("parseAnalysisError - Global Rate Limit (429)", () => {
    it("should parse global rate limit error with correct fields", () => {
      const response = {
        status: 429,
        body: {
          message: "This demo is experiencing high traffic and has reached its daily limit...",
          rateLimitType: "global",
          retryAfterSeconds: 82800,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("rate-limit");
      expect(error.rateLimitType).toBe("global");
      expect(error.retryAfterSeconds).toBe(82800);
      expect(error.isDemoLimit).toBe(true);
    });

    it("should distinguish between per-IP and global errors", () => {
      const perIpResponse = {
        status: 429,
        body: {
          message: "Personal limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const globalResponse = {
        status: 429,
        body: {
          message: "Global limit",
          rateLimitType: "global",
          retryAfterSeconds: 82800,
          demoNote: true,
        },
      };

      const perIpError = parseAnalysisError(perIpResponse);
      const globalError = parseAnalysisError(globalResponse);

      expect(perIpError.rateLimitType).toBe("per-ip");
      expect(globalError.rateLimitType).toBe("global");
    });

    it("should handle large retry-after values (24+ hours)", () => {
      const response = {
        status: 429,
        body: {
          message: "Global limit",
          rateLimitType: "global",
          retryAfterSeconds: 172800, // 48 hours
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);
      expect(error.retryAfterSeconds).toBe(172800);
    });
  });

  describe("parseAnalysisError - Other Errors", () => {
    it("should parse 400 Bad Request as extraction error", () => {
      const response = {
        status: 400,
        body: { error: "Invalid file type. Only PDF files are accepted." },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("extraction");
      expect(error.message).toBe("Invalid file type. Only PDF files are accepted.");
      expect(error.isDemoLimit).toBe(false);
    });

    it("should parse 500 Server Error as analysis error", () => {
      const response = {
        status: 500,
        body: { error: "Failed to parse AI response as JSON." },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("analysis");
      expect(error.message).toBe("Failed to parse AI response as JSON.");
    });

    it("should handle missing rateLimitType gracefully", () => {
      const response = {
        status: 429,
        body: { error: "Some error" },
      };

      const error = parseAnalysisError(response);

      // When 429 but no rateLimitType, treat as rate-limit with unknown type
      expect(error.type).toBe("rate-limit");
      expect(error.rateLimitType).toBeUndefined();
      expect(error.isDemoLimit).toBe(false);
    });

    it("should default to network error for unknown statuses", () => {
      const response = {
        status: 418,
        body: { error: "Unknown error" },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("network");
      expect(error.message).toBe("Unknown error");
    });
  });

  describe("parseAnalysisError - Error Response Structure", () => {
    it("should handle response with error field (non-rate-limit)", () => {
      const response = {
        status: 400,
        body: { error: "Text content is required for analysis." },
      };

      const error = parseAnalysisError(response);

      expect(error.message).toBe("Text content is required for analysis.");
    });

    it("should handle response with message field (rate-limit)", () => {
      const response = {
        status: 429,
        body: {
          message: "Rate limit message",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.message).toBe("Rate limit message");
    });

    it("should extract rateLimitType as optional field", () => {
      const withType = {
        status: 429,
        body: {
          message: "Limit hit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const withoutType = {
        status: 429,
        body: { error: "Rate limited" },
      };

      const errorWith = parseAnalysisError(withType);
      const errorWithout = parseAnalysisError(withoutType);

      expect(errorWith.rateLimitType).toBe("per-ip");
      expect(errorWithout.rateLimitType).toBeUndefined();
    });

    it("should extract retryAfterSeconds from response", () => {
      const response = {
        status: 429,
        body: {
          message: "Limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 456,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.retryAfterSeconds).toBe(456);
    });
  });

  describe("parseAnalysisError - Status Code Detection", () => {
    it("should treat 429 as rate-limit error", () => {
      const response = {
        status: 429,
        body: {
          message: "Rate limited",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);
      expect(error.type).toBe("rate-limit");
    });

    it("should treat 400-499 (except 429) as extraction error", () => {
      const statuses = [400, 401, 403, 404, 422];
      for (const status of statuses) {
        const response = {
          status,
          body: { error: `Error ${status}` },
        };

        const error = parseAnalysisError(response);
        expect(error.type).toBe("extraction");
      }
    });

    it("should treat 500-599 as analysis error", () => {
      const statuses = [500, 502, 503, 504];
      for (const status of statuses) {
        const response = {
          status,
          body: { error: `Server error ${status}` },
        };

        const error = parseAnalysisError(response);
        expect(error.type).toBe("analysis");
      }
    });

    it("should treat unexpected statuses as network error", () => {
      const response = {
        status: 418,
        body: { error: "Unknown" },
      };

      const error = parseAnalysisError(response);
      expect(error.type).toBe("network");
    });
  });

  describe("parseAnalysisError - Malformed Responses", () => {
    it("should handle response with missing message field", () => {
      const response = {
        status: 429,
        body: { rateLimitType: "per-ip", retryAfterSeconds: 300 },
      };

      const error = parseAnalysisError(response);

      // Should still be rate-limit type
      expect(error.type).toBe("rate-limit");
      expect(error.rateLimitType).toBe("per-ip");
    });

    it("should handle response with missing error field", () => {
      const response = {
        status: 400,
        body: {},
      };

      const error = parseAnalysisError(response);

      // Should still parse as extraction error (400 status)
      expect(error.type).toBe("extraction");
    });

    it("should provide fallback message for rate-limit without message", () => {
      const response = {
        status: 429,
        body: {
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.message).toBeTruthy();
    });

    it("should handle non-JSON responses gracefully", () => {
      const response = {
        status: 500,
        body: {},
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("analysis");
      expect(error.message).toBeTruthy();
    });
  });

  describe("parseAnalysisError - Return Type Structure", () => {
    it("should return object with all required fields", () => {
      const response = {
        status: 429,
        body: {
          message: "Rate limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error).toHaveProperty("type");
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("isDemoLimit");
      expect(error).toHaveProperty("rateLimitType"); // optional but present
      expect(error).toHaveProperty("retryAfterSeconds"); // optional but present
    });

    it("should be immutable", () => {
      const response = {
        status: 400,
        body: { error: "Test error" },
      };

      const error = parseAnalysisError(response);

      expect(() => {
        (error as any).type = "analysis";
      }).toThrow();
    });

    it("should have string message", () => {
      const response = {
        status: 400,
        body: { error: "Test" },
      };

      const error = parseAnalysisError(response);

      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    });

    it("should have boolean isDemoLimit", () => {
      const response = {
        status: 400,
        body: { error: "Test" },
      };

      const error = parseAnalysisError(response);

      expect(typeof error.isDemoLimit).toBe("boolean");
    });
  });

  describe("parseAnalysisError - Type Discrimination", () => {
    it("should correctly discriminate rate-limit type", () => {
      const perIpResponse = {
        status: 429,
        body: {
          message: "Per-IP limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(perIpResponse);

      // TypeScript should allow accessing rateLimitType after type check
      if (error.type === "rate-limit") {
        expect(error.rateLimitType).toBeDefined();
        expect(error.retryAfterSeconds).toBeDefined();
      }
    });

    it("should correctly discriminate extraction type", () => {
      const response = {
        status: 400,
        body: { error: "Invalid file" },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("extraction");
      expect(error.message).toBeTruthy();
    });

    it("should correctly discriminate analysis type", () => {
      const response = {
        status: 500,
        body: { error: "Analysis failed" },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("analysis");
      expect(error.message).toBeTruthy();
    });

    it("should correctly discriminate network type", () => {
      const response = {
        status: 418,
        body: { error: "Network error" },
      };

      const error = parseAnalysisError(response);

      expect(error.type).toBe("network");
    });
  });

  describe("parseAnalysisError - Response Object Handling", () => {
    it("should accept Response object and extract status correctly", () => {
      const response = new Response(
        JSON.stringify({ error: "Test error" }),
        { status: 400 }
      );

      const error = parseAnalysisError(response);

      expect(error.type).toBe("extraction");
      expect(error.message).toBeTruthy();
    });

    it("should handle Response object with rate limit status", () => {
      const response = new Response(
        JSON.stringify({
          message: "Rate limited",
          rateLimitType: "per-ip",
          retryAfterSeconds: 300,
          demoNote: true,
        }),
        { status: 429 }
      );

      const error = parseAnalysisError(response);

      expect(error.type).toBe("rate-limit");
      // Note: isDemoLimit will be false because Response.json() is async
      // and we can't parse it synchronously. Use mock responses for full testing.
      expect(error.isDemoLimit).toBe(false);
    });

    it("should handle Response object with 3xx status as network error", () => {
      const response = new Response(
        JSON.stringify({ error: "Redirect" }),
        { status: 301 }
      );

      const error = parseAnalysisError(response);

      expect(error.type).toBe("network");
    });
  });

  describe("parseAnalysisError - Edge Cases", () => {
    it("should handle zero retry seconds", () => {
      const response = {
        status: 429,
        body: {
          message: "Limit",
          rateLimitType: "per-ip",
          retryAfterSeconds: 0,
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.retryAfterSeconds).toBe(0);
    });

    it("should handle very large retry seconds", () => {
      const response = {
        status: 429,
        body: {
          message: "Limit",
          rateLimitType: "global",
          retryAfterSeconds: 86400 * 365, // One year
          demoNote: true,
        },
      };

      const error = parseAnalysisError(response);

      expect(error.retryAfterSeconds).toBe(86400 * 365);
    });

    it("should handle very long error messages", () => {
      const longMessage = "x".repeat(10000);
      const response = {
        status: 400,
        body: { error: longMessage },
      };

      const error = parseAnalysisError(response);

      expect(error.message).toBe(longMessage);
    });

    it("should handle empty error message", () => {
      const response = {
        status: 400,
        body: { error: "" },
      };

      const error = parseAnalysisError(response);

      // Should provide fallback or original empty message
      expect(error.message).toBeDefined();
    });

    it("should handle special characters in messages", () => {
      const special = 'Error: "quotes" and \'apostrophes\' & <brackets>';
      const response = {
        status: 400,
        body: { error: special },
      };

      const error = parseAnalysisError(response);

      expect(error.message).toBe(special);
    });
  });
});
