const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes
const EVICTION_AGE_MS = 2 * 60 * 60_000; // 2 hours

interface RateLimitEntry {
  readonly count: number;
  readonly firstRequest: number;
}

interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfter: number;
}

let store = new Map<string, RateLimitEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const freshStore = new Map<string, RateLimitEntry>();
    for (const [ip, entry] of store) {
      if (now - entry.firstRequest < EVICTION_AGE_MS) {
        freshStore.set(ip, entry);
      }
    }
    store = freshStore;
  }, CLEANUP_INTERVAL_MS);

  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function checkRateLimit(ip: string): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = store.get(ip);

  // No previous entry or window has expired — start fresh
  if (!entry || now - entry.firstRequest >= WINDOW_MS) {
    store.set(ip, { count: 1, firstRequest: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfter: 0 };
  }

  // Within the window — check limit
  if (entry.count < MAX_REQUESTS) {
    store.set(ip, { count: entry.count + 1, firstRequest: entry.firstRequest });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - (entry.count + 1),
      retryAfter: 0,
    };
  }

  // Limit exceeded
  const elapsed = now - entry.firstRequest;
  const retryAfter = Math.ceil((WINDOW_MS - elapsed) / 1000);
  return { allowed: false, remaining: 0, retryAfter };
}

export function resetRateLimiter(): void {
  store = new Map();
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
