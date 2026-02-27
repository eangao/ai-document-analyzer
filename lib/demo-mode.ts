/**
 * Demo Mode Configuration
 * Controls cost-saving features like text truncation
 */

/**
 * Enable demo mode from environment variable
 * When true, truncates document text to 5K chars before Claude API call
 * Reduces token usage by ~80% with minimal quality impact
 */
export const DEMO_MODE = process.env.DEMO_MODE === "true";

/**
 * Truncation length in demo mode (5000 characters)
 * Approximately 1250-1500 tokens depending on language
 * Saves ~80% of typical API cost per request
 */
export const DEMO_TRUNCATE_LENGTH = 5000;

/**
 * Truncation length in production (80000 characters)
 * Approximately 20000 tokens
 * Full document analysis capability
 */
export const PRODUCTION_TRUNCATE_LENGTH = 80000;

/**
 * Get the appropriate truncation length based on demo mode setting
 * Returns DEMO_TRUNCATE_LENGTH if DEMO_MODE is true, else PRODUCTION_TRUNCATE_LENGTH
 */
export function getTruncationLength(): number {
  return DEMO_MODE ? DEMO_TRUNCATE_LENGTH : PRODUCTION_TRUNCATE_LENGTH;
}
