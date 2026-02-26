/**
 * Type definitions for PDF extraction operations.
 * Supports multiple extraction backends (unpdf, pdf-parse, etc.)
 */

/**
 * Result of successful PDF text extraction
 */
export interface PDFExtractionResult {
  readonly text: string;
  readonly pageCount: number;
  readonly title: string;
}

/**
 * Specific error types for PDF extraction failures
 */
export type PDFExtractionErrorType =
  | "CORRUPTED_PDF"
  | "SCANNED_PDF"
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "EMPTY_DOCUMENT"
  | "INVALID_INPUT"
  | "UNKNOWN_ERROR";

/**
 * Structured error information for PDF extraction
 */
export interface PDFExtractionError extends Error {
  readonly type: PDFExtractionErrorType;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Configuration options for PDF extraction
 */
export interface PDFExtractionOptions {
  readonly maxTextLength?: number;
  readonly minTextLength?: number;
  readonly includeMetadata?: boolean;
}

/**
 * Validation result for PDF file
 */
export interface PDFValidationResult {
  readonly isValid: boolean;
  readonly error?: PDFExtractionErrorType;
  readonly message?: string;
}
