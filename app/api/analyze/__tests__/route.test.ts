import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DocumentAnalysis } from "@/types";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { POST } from "@/app/api/analyze/route";
import { checkRateLimit } from "@/lib/rate-limit";

const mockedCheckRateLimit = vi.mocked(checkRateLimit);

const sampleAnalysis: DocumentAnalysis = {
  summary: "This is a test contract between parties A and B.",
  documentType: "contract",
  keyEntities: [
    { name: "Party A", type: "organization", confidence: 0.95, context: "Signing party" },
  ],
  keyDates: [
    { date: "2025-01-15", description: "Effective date", importance: "high" },
  ],
  financialItems: [
    { description: "Service fee", amount: 5000, currency: "USD", category: "payment" },
  ],
  obligations: [
    {
      party: "Party A",
      description: "Deliver services",
      deadline: "2025-06-01",
      status: "active",
    },
  ],
  riskFlags: [
    { title: "Liability clause", description: "Unlimited liability", severity: "high" },
  ],
  keyTerms: [
    { term: "Force Majeure", definition: "Unforeseeable circumstances", category: "legal" },
  ],
  actionItems: ["Review liability clause", "Confirm effective date"],
};

function createJsonRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: "test-key-123" };
    mockedCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      retryAfter: 0,
    });
  });

  it("should return analysis for valid text input", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(sampleAnalysis) }],
    });

    const request = createJsonRequest({ text: "This is a sample contract text..." });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe(sampleAnalysis.summary);
    expect(body.documentType).toBe("contract");
    expect(body.keyEntities).toHaveLength(1);
    expect(body.riskFlags).toHaveLength(1);
  });

  it("should return 400 when text is missing", async () => {
    const request = createJsonRequest({});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/text/i);
  });

  it("should return 400 when text is empty", async () => {
    const request = createJsonRequest({ text: "   " });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/text/i);
  });

  it("should return 429 when rate limited", async () => {
    mockedCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfter: 30,
    });

    const request = createJsonRequest({ text: "Some document text" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatch(/rate limit/i);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("should return 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const request = createJsonRequest({ text: "Some text" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/api key/i);
  });

  it("should strip markdown backticks from Claude response", async () => {
    const wrappedJson = "```json\n" + JSON.stringify(sampleAnalysis) + "\n```";
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: wrappedJson }],
    });

    const request = createJsonRequest({ text: "Contract text here" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe(sampleAnalysis.summary);
  });

  it("should return 500 when Claude returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "This is not valid JSON at all" }],
    });

    const request = createJsonRequest({ text: "Some text" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/parse|json/i);
  });

  it("should return 500 when Claude API throws an error", async () => {
    mockCreate.mockRejectedValue(new Error("API connection failed"));

    const request = createJsonRequest({ text: "Some text" });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it("should call Claude with correct model and parameters", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(sampleAnalysis) }],
    });

    const request = createJsonRequest({ text: "Analyze this document" });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 4096,
      })
    );
  });

  it("should return 400 when request body is not valid JSON", async () => {
    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json!!!}",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/json/i);
  });

  it("should use IP from x-forwarded-for header for rate limiting", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(sampleAnalysis) }],
    });

    const request = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.50",
      },
      body: JSON.stringify({ text: "Document text" }),
    });

    await POST(request);

    expect(mockedCheckRateLimit).toHaveBeenCalledWith("203.0.113.50");
  });
});
