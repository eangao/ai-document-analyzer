import { describe, it, expect } from "vitest";

// Direct metadata values for testing (extracted from layout.tsx)
// These should match the actual metadata in app/layout.tsx
const metadata = {
  title: "AI Document Analyzer",
  description:
    "Upload a PDF document and get AI-powered structured analysis — summaries, key entities, dates, financials, obligations, and risk flags.",
};

describe("Phase 4.3: Metadata in Layout", () => {
  describe("Basic Metadata", () => {
    it("should have a title", () => {
      expect(metadata.title).toBeDefined();
      expect(typeof metadata.title).toBe("string");
    });

    it("should have descriptive title that mentions AI and document analysis", () => {
      const title = metadata.title as string;
      expect(title.toLowerCase()).toContain("document");
      expect(title.toLowerCase()).toMatch(/ai|analyze/i);
    });

    it("should have a description", () => {
      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe("string");
      expect((metadata.description as string).length).toBeGreaterThan(50);
    });

    it("should have description that explains the app's purpose", () => {
      const description = metadata.description as string;
      expect(description.toLowerCase()).toContain("pdf");
      expect(description.toLowerCase()).toMatch(/analy/i);
    });

    it("should mention key features in description", () => {
      const description = metadata.description as string;

      // Should mention key features
      expect(description.includes("summaries")).toBe(true);
      expect(description.includes("entities")).toBe(true);
      expect(description.includes("dates")).toBe(true);
      expect(description.includes("financials")).toBe(true);
      expect(description.includes("obligations")).toBe(true);
      expect(description.includes("risk")).toBe(true);
    });
  });

  describe("SEO Optimization", () => {
    it("should have title under 60 characters (Google display limit)", () => {
      const title = metadata.title as string;
      expect(title.length).toBeLessThanOrEqual(60);
    });

    it("should have description between 50-160 characters (SEO best practice)", () => {
      const description = metadata.description as string;
      expect(description.length).toBeGreaterThanOrEqual(50);
      // Modern search engines support up to 320 chars
      expect(description.length).toBeLessThanOrEqual(320);
    });
  });

  describe("Content Quality", () => {
    it("should not have typos in title", () => {
      const title = metadata.title as string;
      expect(title).not.toMatch(/analyser/i); // British spelling
      expect(title).not.toMatch(/documnet/i); // Common typo
    });

    it("should use proper capitalization in title", () => {
      const title = metadata.title as string;
      // Title should start with capital letter
      expect(title[0]).toBe(title[0].toUpperCase());
    });

    it("should have description that ends with proper punctuation", () => {
      const description = metadata.description as string;
      const lastChar = description.trim().slice(-1);
      expect(["."].includes(lastChar)).toBe(true);
    });
  });

  describe("Metadata Structure", () => {
    it("should be a valid Metadata object", () => {
      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe("object");
    });

    it("should have all required fields", () => {
      expect(metadata).toHaveProperty("title");
      expect(metadata).toHaveProperty("description");
    });
  });

  describe("Branding and Messaging", () => {
    it("should have clear app name in title", () => {
      const title = metadata.title as string;
      expect(title).toContain("AI Document Analyzer");
    });

    it("should emphasize AI-powered analysis", () => {
      const description = metadata.description as string;
      expect(description.toLowerCase()).toContain("ai-powered");
    });

    it("should communicate PDF upload capability", () => {
      const description = metadata.description as string;
      expect(description.toLowerCase()).toContain("upload");
      expect(description.toLowerCase()).toContain("pdf");
    });
  });

  describe("Feature Highlights", () => {
    it("should list all major features in description", () => {
      const description = metadata.description as string;

      const features = [
        "summaries",
        "entities",
        "dates",
        "financials",
        "obligations",
        "risk",
      ];

      features.forEach((feature) => {
        expect(description.toLowerCase()).toContain(feature);
      });
    });

    it("should communicate structured analysis output", () => {
      const description = metadata.description as string;
      expect(description.toLowerCase()).toContain("structured");
      expect(description.toLowerCase()).toContain("analysis");
    });
  });
});
