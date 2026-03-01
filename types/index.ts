export type {
  DocumentType,
  RiskSeverity,
  FinancialCategory,
  ObligationStatus,
  Entity,
  KeyDate,
  FinancialItem,
  Obligation,
  RiskFlag,
  KeyTerm,
  DocumentAnalysis,
} from "./analysis";

/**
 * Rate Limit Error Response
 * Discriminated union for different rate limit error types
 * Allows frontend to handle per-IP and global limits with different messaging
 */
export type RateLimitErrorResponse =
  | {
      readonly rateLimitType: "per-ip";
      readonly retryAfterSeconds: number;
      readonly message: string;
      readonly demoNote: true;
    }
  | {
      readonly rateLimitType: "global";
      readonly retryAfterSeconds: number;
      readonly message: string;
      readonly demoNote: true;
    };
