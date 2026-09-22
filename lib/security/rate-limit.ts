/**
 * Rate limiter with optional Redis backend.
 * Falls back to in-process Map when REDIS_URL is unset (dev / single-instance).
 * Contract remains identical: checkRateLimit(key, { windowMs, max }).
 */

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

// ---------- in-memory fallback ----------
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const b = memoryBuckets.get(key);
  if (!b || b.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.max - 1 };
  }
  if (b.count >= opts.max) return { ok: false, remaining: 0 };
  b.count += 1;
  return { ok: true, remaining: opts.max - b.count };
}

// ---------- Redis (lazy) ----------
type RedisClient = {
  incr: (k: string) => Promise<number>;
  pexpire: (k: string, ms: number) => Promise<number>;
  pttl: (k: string) => Promise<number>;
};

let redisClient: RedisClient | null = null;
let redisInitAttempted = false;

async function getRedis(): Promise<RedisClient | null> {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    // Dynamic import so the package is optional at build time if not installed.
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', (err: Error) => console.error('redis rate-limit error', err.message));
    await client.connect();
    redisClient = client as unknown as RedisClient;
    return redisClient;
  } catch (e) {
    console.warn('Redis unavailable for rate limiting; using in-memory fallback', (e as Error).message);
    return null;
  }
}

async function redisCheck(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const client = await getRedis();
  if (!client) return memoryCheck(key, opts);

  const redisKey = `rl:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.pexpire(redisKey, opts.windowMs);
  }
  if (count > opts.max) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: Math.max(0, opts.max - count) };
}

/**
 * Primary entry point. Async so Redis can be used; callers should await.
 * For backward compatibility a sync wrapper is also exported.
 */
export async function checkRateLimitAsync(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  if (process.env.REDIS_URL) {
    return redisCheck(key, opts);
  }
  return memoryCheck(key, opts);
}

/** Synchronous fallback used by existing call sites until they migrate to async. */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  // When Redis is configured we still fall back to memory for sync callers;
  // prefer checkRateLimitAsync in new code.
  return memoryCheck(key, opts);
}
