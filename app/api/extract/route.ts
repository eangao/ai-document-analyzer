import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateRateLimitError } from "@/lib/error-messages";
import { extractPDFText } from "@/lib/pdf-extractor";
import type { PDFExtractionError } from "@/types/pdf-extraction";
import type { RateLimitErrorResponse } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 80_000;
const MIN_TEXT_LENGTH = 50;
const ALLOWED_MIME_TYPES = ["application/pdf"];

interface ExtractResponse {
  readonly text: string;
  readonly pageCount: number;
  readonly title: string;
}

interface ErrorResponse {
  readonly error: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<ExtractResponse | ErrorResponse | RateLimitErrorResponse>> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const rateCheck = checkRateLimit(ip, now);

    if (!rateCheck.allowed) {
      const errorInfo = generateRateLimitError(
        rateCheck.limitType!,
        rateCheck.retryAfter
      );
      return NextResponse.json(
        {
          message: errorInfo.message,
          rateLimitType: rateCheck.limitType,
          retryAfterSeconds: rateCheck.retryAfter,
          demoNote: true,
        } as RateLimitErrorResponse,
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided. Please upload a file." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // Convert file to Buffer for pdf extraction
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract PDF text using the new extractor utility
    const result = await extractPDFText(buffer, {
      minTextLength: MIN_TEXT_LENGTH,
      maxTextLength: MAX_TEXT_LENGTH,
    });

    return NextResponse.json({
      text: result.text,
      pageCount: result.pageCount,
      title: result.title,
    });
  } catch (error) {
    console.error("PDF extraction error:", error);

    // Handle specific PDF extraction errors
    if (error && typeof error === "object" && "type" in error) {
      const pdfError = error as PDFExtractionError;
      if (pdfError.type === "EMPTY_DOCUMENT") {
        return NextResponse.json(
          {
            error:
              "Could not extract sufficient text from this PDF. Scanned or image-only PDFs are not supported.",
          },
          { status: 400 }
        );
      }
      if (pdfError.type === "CORRUPTED_PDF") {
        return NextResponse.json(
          {
            error: "The PDF file appears to be corrupted or invalid.",
          },
          { status: 400 }
        );
      }
    }

    // Generic error fallback
    return NextResponse.json(
      {
        error:
          "Failed to extract text from PDF. The file may be corrupted or unsupported.",
      },
      { status: 500 }
    );
  }
}
