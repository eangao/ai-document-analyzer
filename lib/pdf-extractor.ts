/**
 * PDF text extraction utility.
 * Provides a clean, typed interface for extracting text from PDF buffers.
 * Uses unpdf library (modern, TypeScript-native, no pdfjs-dist dependency).
 *
 * Key features:
 * - Typed error handling with specific error types
 * - Input validation
 * - Configurable text length limits
 * - Immutable operations (no mutations)
 */

import type {
  PDFExtractionResult,
  PDFExtractionError,
  PDFExtractionErrorType,
  PDFValidationResult,
  PDFExtractionOptions,
} from "@/types/pdf-extraction";

// Constants
const DEFAULT_MIN_TEXT_LENGTH = 50;
const DEFAULT_MAX_TEXT_LENGTH = 80_000;

/**
 * Creates a properly typed PDFExtractionError.
 * All errors inherit from Error for compatibility with try-catch.
 */
export function createPDFExtractionError(
  type: PDFExtractionErrorType,
  message: string,
  details?: Record<string, unknown>
): PDFExtractionError {
  const error = new Error(message);
  error.name = "PDFExtractionError";
  return Object.assign(error, { type, details }) as PDFExtractionError;
}

/**
 * Validates PDF input before extraction.
 * Returns structured validation result.
 */
export function validatePDFInput(
  input: unknown
): PDFValidationResult {
  // Check for null/undefined
  if (input === null || input === undefined) {
    return {
      isValid: false,
      error: "INVALID_INPUT",
      message: "PDF buffer is required. Received null or undefined.",
    };
  }

  // Check for Buffer or Uint8Array
  const isBuffer = Buffer.isBuffer(input);
  const isUint8Array = input instanceof Uint8Array;

  if (!isBuffer && !isUint8Array) {
    return {
      isValid: false,
      error: "INVALID_INPUT",
      message: `Expected Buffer or Uint8Array, received ${typeof input}.`,
    };
  }

  return { isValid: true };
}

/**
 * Extracts text from a PDF buffer using unpdf library.
 *
 * @param buffer - PDF file as Buffer or Uint8Array
 * @param options - Configuration options (maxTextLength, minTextLength)
 * @returns Promise<PDFExtractionResult> with text, pageCount, and title
 * @throws PDFExtractionError with specific error type
 */
export async function extractPDFText(
  buffer: Buffer | Uint8Array,
  options?: PDFExtractionOptions
): Promise<PDFExtractionResult> {
  // Validate input
  const validation = validatePDFInput(buffer);
  if (!validation.isValid) {
    throw createPDFExtractionError(
      "INVALID_INPUT",
      validation.message || "Invalid PDF input"
    );
  }

  // Get configured limits
  const minTextLength = options?.minTextLength ?? DEFAULT_MIN_TEXT_LENGTH;
  const maxTextLength = options?.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH;

  try {
    // Use unpdf (modern, TypeScript-native, no pdfjs-dist dependency)
    const result = await extractWithUnpdf(buffer, minTextLength, maxTextLength);
    return result;
  } catch (error) {
    // If it's already a custom extraction error, rethrow it immediately
    if (error && typeof error === "object" && "type" in error) {
      throw error;
    }

    // Convert generic errors to typed PDFExtractionError
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createPDFExtractionError("CORRUPTED_PDF", errorMessage);
  }
}

/**
 * Extract using unpdf library (modern, TypeScript-native).
 * @internal
 */
async function extractWithUnpdf(
  buffer: Buffer | Uint8Array,
  minTextLength: number,
  maxTextLength: number
): Promise<PDFExtractionResult> {
  try {
    const { extractText, getMeta } = await import("unpdf");

    // Convert to Uint8Array - unpdf requires Uint8Array
    const uint8Data = Buffer.isBuffer(buffer)
      ? new Uint8Array(buffer)
      : (buffer as Uint8Array);

    // Extract text using unpdf's API with mergePages option
    const textResult = await extractText(uint8Data, { mergePages: true });
    const text = typeof textResult.text === 'string'
      ? textResult.text
      : (textResult.text as string[]).join('\n');

    // Extract metadata for title
    let title = "";
    try {
      const metaResult = await getMeta(uint8Data);
      const titleValue = metaResult.info?.Title || ((metaResult.metadata as unknown) as Record<string, unknown>)?.Title;
      title = typeof titleValue === "string" ? titleValue : "";
    } catch {
      // Metadata extraction is optional, continue without it
    }

    // Validate extracted text length
    if (text.length < minTextLength) {
      throw createPDFExtractionError(
        "EMPTY_DOCUMENT",
        "Could not extract sufficient text from this PDF. Scanned or image-only PDFs are not supported.",
        { extractedLength: text.length, minimumRequired: minTextLength }
      );
    }

    // Truncate if needed
    const finalText =
      text.length > maxTextLength ? text.slice(0, maxTextLength) : text;

    return {
      text: finalText.trim(),
      pageCount: textResult.totalPages || 1,
      title: typeof title === "string" ? title : "",
    };
  } catch (error) {
    // If it's already our custom error, rethrow
    if (error && typeof error === "object" && "type" in error) {
      throw error;
    }

    // Classify the error for better fallback handling
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (
      errorMessage.toLowerCase().includes("corrupted") ||
      errorMessage.toLowerCase().includes("invalid pdf")
    ) {
      throw new Error(`unpdf: ${errorMessage}`);
    }

    // Re-throw for fallback to handle
    throw error;
  }
}

