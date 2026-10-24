import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasRedisConfig = Boolean(
  upstashUrl &&
  upstashToken &&
  !upstashUrl.includes('placeholder')
);

// Serverless Upstash Redis Client
export const redis = hasRedisConfig
  ? new Redis({
      url: upstashUrl!,
      token: upstashToken!,
    })
  : null;

// In-memory fallback rate limiter for testing and development
const memoryRateLimitMap = new Map<string, { count: number; reset: number }>();

export const rateLimiter = {
  /**
   * Limit user or IP to `limit` requests per `windowSeconds` seconds
   */
  async limit(identifier: string, limit = 60, windowSeconds = 60): Promise<{ success: boolean; remaining: number }> {
    if (redis) {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
        prefix: 'dhikrly:ratelimit',
      });
      const res = await ratelimit.limit(identifier);
      return { success: res.success, remaining: res.remaining };
    }

    // In-memory fallback
    const now = Date.now();
    const entry = memoryRateLimitMap.get(identifier);
    if (!entry || now > entry.reset) {
      memoryRateLimitMap.set(identifier, { count: 1, reset: now + windowSeconds * 1000 });
      return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  },
};
