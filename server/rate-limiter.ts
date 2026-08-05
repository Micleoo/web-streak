import type { Context, Next } from 'hono';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number; // e.g. 60 * 1000 (1 min)
  max: number;      // max requests per window
  message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.' } = options;
  const ipStore = new Map<string, RateLimitStore>();

  // Cleanup expired entries every 2 minutes (skip in test environment)
  if (process.env.NODE_ENV !== 'test') {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of ipStore.entries()) {
        if (now > data.resetTime) {
          ipStore.delete(ip);
        }
      }
    }, 120000);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  return async function rateLimiter(c: Context, next: Next) {
    // Determine client IP
    const forwardedFor = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

    const now = Date.now();
    let clientRecord = ipStore.get(ip);

    if (!clientRecord || now > clientRecord.resetTime) {
      clientRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(ip, clientRecord);
    } else {
      clientRecord.count += 1;
    }

    const remaining = Math.max(0, max - clientRecord.count);
    const resetInSec = Math.ceil((clientRecord.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000).toString());

    if (clientRecord.count > max) {
      c.header('Retry-After', resetInSec.toString());
      return c.json({
        error: message,
        retryAfterSeconds: resetInSec,
      }, 429);
    }

    await next();
  };
}
