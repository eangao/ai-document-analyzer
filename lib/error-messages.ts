/**
 * Error message generation for rate limit responses
 * Provides user-friendly, professional messages with context
 */

export interface RateLimitMessage {
  readonly message: string;
  readonly description: string;
  readonly demoNote: true;
}

/**
 * Format seconds into human-readable time format
 * Examples: "45 seconds", "5 minutes", "2 hours"
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

/**
 * Get the next UTC midnight time in human-readable format
 * Used for global daily limit reset messaging
 */
export function getDayResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  // Format as "12:00 AM UTC tomorrow"
  const timeStr = tomorrow.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return `${timeStr} UTC tomorrow`;
}

/**
 * Generate graceful error message for per-IP rate limit
 * Explains limit, when user can retry, and provides context
 */
function generatePerIpError(retryAfterSeconds: number): RateLimitMessage {
  const retryTime = formatRetryTime(retryAfterSeconds);

  const message = `You've reached your personal request limit of 3 documents per hour. Come back in ${retryTime}, or try analyzing a different document in the meantime. We limit requests to keep this demo sustainable. Thanks for understanding!`;

  return Object.freeze({
    message,
    description: "3 documents per hour per user",
    demoNote: true,
  });
}

/**
 * Generate graceful error message for global rate limit
 * Acknowledges popularity, provides reset time, suggests solution
 */
function generateGlobalError(): RateLimitMessage {
  const resetTime = getDayResetTime();

  const message = `This demo is experiencing high traffic and has reached its daily limit of 50 analyses. Please try again at ${resetTime}, or explore the source code to build your own version. Thanks for your interest!`;

  return Object.freeze({
    message,
    description: "50 documents per day across all users",
    demoNote: true,
  });
}

/**
 * Generate user-friendly rate limit error message
 * Discriminates between per-IP and global limits with different messaging
 */
export function generateRateLimitError(
  limitType: "per-ip" | "global",
  retryAfterSeconds: number
): RateLimitMessage {
  if (limitType === "per-ip") {
    return generatePerIpError(retryAfterSeconds);
  }

  // Global limit
  return generateGlobalError();
}
