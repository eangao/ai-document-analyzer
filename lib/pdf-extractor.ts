/**
 * PDF text extraction utility.
 * Provides a clean, typed interface for extracting text from PDF buffers.
 * Uses unpdf library (primary) with fallback to pdf-parse if needed.
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

import { PDFParse } from "pdf-parse";

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
 * Extracts text from a PDF buffer.
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
      validation.error || "INVALID_INPUT",
      validation.message || "Invalid PDF input"
    );
  }

  // Get configured limits
  const minTextLength = options?.minTextLength ?? DEFAULT_MIN_TEXT_LENGTH;
  const maxTextLength = options?.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH;

  try {
    // Try pdf-parse first (more reliable for test PDFs and real-world PDFs)
    const result = await extractWithPdfParse(buffer, minTextLength, maxTextLength);
    return result;
  } catch (pdfParseError) {
    // If it's already a custom extraction error, rethrow it immediately
    if (pdfParseError && typeof pdfParseError === "object" && "type" in pdfParseError) {
      throw pdfParseError;
    }

    // Try unpdf as fallback (modern, TypeScript-native)
    try {
      const result = await extractWithUnpdf(
        buffer,
        minTextLength,
        maxTextLength
      );
      return result;
    } catch (unpdfError) {
      // Both failed - provide helpful error
      const errorMessage =
        pdfParseError instanceof Error ? pdfParseError.message : String(pdfParseError);
      throw createPDFExtractionError("CORRUPTED_PDF", errorMessage);
    }
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

/**
 * Extract using pdf-parse library (fallback).
 * @internal
 */
export async function extractWithPdfParse(
  buffer: Buffer | Uint8Array,
  minTextLength: number,
  maxTextLength: number
): Promise<PDFExtractionResult> {
  try {
    // Convert Uint8Array to Buffer if needed
    const bufferData = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer as Uint8Array);

    // Extract text using PDFParse class
    const pdfParser = new PDFParse({ data: bufferData });
    const textResult = await pdfParser.getText();
    const infoResult = await pdfParser.getInfo();

    const data = {
      text: textResult.text,
      numpages: textResult.pages.length,
      info: infoResult.info,
    };

    // Validate extracted text length
    const text = data.text || "";
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

    // Get metadata title
    const titleValue = data.info?.Title || infoResult.info?.Title;
    const title = typeof titleValue === "string" ? titleValue : "";

    return {
      text: finalText.trim(),
      pageCount: data.numpages || 1,
      title,
    };
  } catch (error) {
    // If it's already our custom error, rethrow
    if (error && typeof error === "object" && "type" in error) {
      throw error;
    }

    // Classify the error
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (
      errorMessage.toLowerCase().includes("corrupted") ||
      errorMessage.toLowerCase().includes("invalid pdf")
    ) {
      throw createPDFExtractionError("CORRUPTED_PDF", errorMessage);
    }

    if (errorMessage.toLowerCase().includes("not found")) {
      throw createPDFExtractionError(
        "UNSUPPORTED_FORMAT",
        "PDF format is not supported or corrupted."
      );
    }

    throw createPDFExtractionError(
      "UNKNOWN_ERROR",
      `Failed to extract PDF text: ${errorMessage}`
    );
  }
}
