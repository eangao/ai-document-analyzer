// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock unpdf before importing the route
const mockExtractText = vi.fn();
const mockGetMeta = vi.fn();

vi.mock("unpdf", () => ({
  extractText: mockExtractText,
  getMeta: mockGetMeta,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { POST } from "@/app/api/extract/route";
import { checkRateLimit } from "@/lib/rate-limit";

const mockedCheckRateLimit = vi.mocked(checkRateLimit);

function createFormDataRequest(
  file: File | null,
  options?: { headers?: Record<string, string> }
): Request {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  return new Request("http://localhost:3000/api/extract", {
    method: "POST",
    body: formData,
    ...options,
  });
}

function createPdfFile(
  content: BlobPart,
  name = "test.pdf",
  type = "application/pdf"
): File {
  return new File([content], name, { type });
}

describe("POST /api/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      retryAfter: 0,
    });
  });

  it("should extract text from a valid PDF", async () => {
    const sampleText = "This is a sample PDF document with enough text to pass validation.";
    mockExtractText.mockResolvedValue({
      text: sampleText,
      totalPages: 3,
    } as any);
    mockGetMeta.mockResolvedValue({
      info: { Title: "Test PDF" },
    } as any);

    const file = createPdfFile("fake-pdf-content");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.text).toBe(sampleText);
    expect(body.pageCount).toBe(3);
    expect(body.title).toBe("Test PDF");
  });

  it("should return 400 when no file is provided", async () => {
    const request = createFormDataRequest(null);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("should return 400 for non-PDF file types", async () => {
    const file = new File(["hello"], "test.txt", { type: "text/plain" });
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/pdf/i);
  });

  it("should return 400 for files exceeding 10MB", async () => {
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = createPdfFile(new Blob([largeContent]), "huge.pdf");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/size/i);
  });

  it("should return 400 for scanned/image-only PDFs (text < 50 chars)", async () => {
    mockExtractText.mockResolvedValue({
      text: "   \n\n  short  ",
      totalPages: 1,
    } as any);
    mockGetMeta.mockResolvedValue({
      info: {},
    } as any);

    const file = createPdfFile("fake-pdf");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/scanned|text/i);
  });

  it("should truncate extracted text to 80,000 characters", async () => {
    const longText = "A".repeat(100_000);
    mockExtractText.mockResolvedValue({
      text: longText,
      totalPages: 1,
    } as any);
    mockGetMeta.mockResolvedValue({
      info: {},
    } as any);

    const file = createPdfFile("fake-pdf");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.text.length).toBe(80_000);
  });

  it("should return 400 when pdf-parse throws a corruption error", async () => {
    mockExtractText.mockRejectedValue(new Error("Corrupted PDF"));

    const file = createPdfFile("bad-pdf");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("should reject files with .pdf extension but wrong MIME type", async () => {
    const file = new File(["not a pdf"], "fake.pdf", { type: "text/html" });
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/pdf/i);
  });

  it("should return 429 when rate limited", async () => {
    mockedCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfter: 45,
    });

    const file = createPdfFile("fake-pdf-content");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatch(/rate limit/i);
    expect(response.headers.get("Retry-After")).toBe("45");
  });

  it("should not leak internal error details on unpdf failure", async () => {
    mockExtractText.mockRejectedValue(new Error("Internal buffer overflow at 0x7fff"));

    const file = createPdfFile("bad-pdf");
    const request = createFormDataRequest(file);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400); // Corrupted PDF is a client error
    expect(body.error).not.toMatch(/buffer|0x7fff/i);
    expect(body.error).toMatch(/corrupted|invalid/i);
  });
});
