import { NextResponse } from "next/server";
// @ts-expect-error pdf-parse has incomplete type definitions
import pdfParse from "pdf-parse";
import { checkRateLimit } from "@/lib/rate-limit";

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
): Promise<NextResponse<ExtractResponse | ErrorResponse>> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const trimmedText = parsed.text.trim();

    if (trimmedText.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Could not extract sufficient text from this PDF. Scanned or image-only PDFs are not supported.",
        },
        { status: 400 }
      );
    }

    const text =
      trimmedText.length > MAX_TEXT_LENGTH
        ? trimmedText.slice(0, MAX_TEXT_LENGTH)
        : trimmedText;

    return NextResponse.json({
      text,
      pageCount: parsed.numpages,
      title: parsed.info?.Title ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to extract text from PDF. The file may be corrupted or unsupported." },
      { status: 500 }
    );
  }
}
