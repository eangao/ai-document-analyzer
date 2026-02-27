// Legacy constants (kept for backward compatibility)
const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes
const EVICTION_AGE_MS = 2 * 60 * 60_000; // 2 hours

// Phase 1: Enhanced dual-layer protection
const MAX_REQUESTS_PER_IP_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;
const MAX_GLOBAL_REQUESTS_PER_DAY = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

// Per-IP hourly tracking
interface PerIpEntry {
  readonly count: number;
  readonly windowStart: number;
}

// Global daily tracking
interface GlobalEntry {
  readonly count: number;
  readonly dayStart: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfter: number;
  readonly limitType?: "per-ip" | "global";
}

// Legacy interface for backward compatibility
interface RateLimitEntry {
  readonly count: number;
  readonly firstRequest: number;
}

// Storage - immutable by default, updated through new references
let perIpStore = new Map<string, PerIpEntry>();
let globalStore: GlobalEntry | null = null;
let legacyStore = new Map<string, RateLimitEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Check per-IP hourly limit (3 requests per hour)
 * Returns immutable result object with limitType discriminator
 */
export function checkPerIpHourlyLimit(
  ip: string,
  now: number
): RateLimitResult {
  const entry = perIpStore.get(ip);

  // No previous entry or window has expired — start fresh
  if (!entry || now - entry.windowStart >= HOUR_MS) {
    perIpStore.set(ip, { count: 1, windowStart: now });
    return Object.freeze({
      allowed: true,
      remaining: MAX_REQUESTS_PER_IP_PER_HOUR - 1,
      retryAfter: 0,
      limitType: "per-ip",
    });
  }

  // Within the window — check limit
  if (entry.count < MAX_REQUESTS_PER_IP_PER_HOUR) {
    const newCount = entry.count + 1;
    perIpStore.set(ip, { count: newCount, windowStart: entry.windowStart });
    return Object.freeze({
      allowed: true,
      remaining: MAX_REQUESTS_PER_IP_PER_HOUR - newCount,
      retryAfter: 0,
      limitType: "per-ip",
    });
  }

  // Limit exceeded
  const elapsed = now - entry.windowStart;
  const retryAfter = Math.ceil((HOUR_MS - elapsed) / 1000);
  return Object.freeze({
    allowed: false,
    remaining: 0,
    retryAfter,
    limitType: "per-ip",
  });
}

/**
 * Check global daily limit (50 requests per day)
 * Returns immutable result object with limitType discriminator
 */
export function checkGlobalDailyLimit(now: number): RateLimitResult {
  const entry = globalStore;

  // No previous entry or window has expired — start fresh
  if (!entry || now - entry.dayStart >= DAY_MS) {
    globalStore = { count: 1, dayStart: now };
    return Object.freeze({
      allowed: true,
      remaining: MAX_GLOBAL_REQUESTS_PER_DAY - 1,
      retryAfter: 0,
      limitType: "global",
    });
  }

  // Within the window — check limit
  if (entry.count < MAX_GLOBAL_REQUESTS_PER_DAY) {
    const newCount = entry.count + 1;
    globalStore = { count: newCount, dayStart: entry.dayStart };
    return Object.freeze({
      allowed: true,
      remaining: MAX_GLOBAL_REQUESTS_PER_DAY - newCount,
      retryAfter: 0,
      limitType: "global",
    });
  }

  // Limit exceeded
  const elapsed = now - entry.dayStart;
  const retryAfter = Math.ceil((DAY_MS - elapsed) / 1000);
  return Object.freeze({
    allowed: false,
    remaining: 0,
    retryAfter,
    limitType: "global",
  });
}

/**
 * Combined rate limit check: enforces both per-IP and global limits
 * Returns the most restrictive limit if multiple are violated
 * Returns immutable result with discriminated union limitType
 */
export function checkRateLimit(
  ip: string,
  now: number = Date.now()
): RateLimitResult {
  startCleanup();

  const perIpCheck = checkPerIpHourlyLimit(ip, now);
  const globalCheck = checkGlobalDailyLimit(now);

  // If per-IP limit is exceeded, return that error
  if (!perIpCheck.allowed) {
    return perIpCheck;
  }

  // If global limit is exceeded, return that error
  if (!globalCheck.allowed) {
    return globalCheck;
  }

  // Both limits allow - return success with minimum remaining
  return Object.freeze({
    allowed: true,
    remaining: Math.min(perIpCheck.remaining, globalCheck.remaining),
    retryAfter: 0,
    limitType: undefined,
  });
}

// Legacy cleanup and reset functions
function startCleanup(): void {
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const freshStore = new Map<string, RateLimitEntry>();
    for (const [ip, entry] of legacyStore) {
      if (now - entry.firstRequest < EVICTION_AGE_MS) {
        freshStore.set(ip, entry);
      }
    }
    legacyStore = freshStore;
  }, CLEANUP_INTERVAL_MS);

  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function resetRateLimiter(): void {
  perIpStore = new Map();
  globalStore = null;
  legacyStore = new Map();
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
