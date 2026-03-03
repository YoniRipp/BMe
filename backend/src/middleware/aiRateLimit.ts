/**
 * Per-user daily rate limits for AI endpoints.
 * Uses Redis counters with TTL when available, falls back to in-memory Map.
 */
import { getRedisClient, isRedisConfigured } from '../redis/client.js';
import { logger } from '../lib/logger.js';

interface RateLimitConfig {
  endpoint: string;
  maxPerDay: number;
}

const inMemoryCounters = new Map<string, { count: number; expiresAt: number }>();

function todayKey(userId: string, endpoint: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `ai_usage:${userId}:${endpoint}:${date}`;
}

async function incrementRedis(key: string): Promise<number> {
  const redis = await getRedisClient();
  if (!redis) return -1;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 86400);
  }
  return count;
}

function incrementInMemory(key: string): number {
  const now = Date.now();
  const entry = inMemoryCounters.get(key);
  if (entry && entry.expiresAt > now) {
    entry.count += 1;
    return entry.count;
  }
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  inMemoryCounters.set(key, { count: 1, expiresAt: midnight.getTime() });
  return 1;
}

export function aiRateLimit({ endpoint, maxPerDay }: RateLimitConfig) {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next();

    const key = todayKey(userId, endpoint);

    try {
      let count: number;
      if (isRedisConfigured()) {
        count = await incrementRedis(key);
        if (count === -1) count = incrementInMemory(key);
      } else {
        count = incrementInMemory(key);
      }

      if (count > maxPerDay) {
        return res.status(429).json({
          error: `Daily limit reached for ${endpoint} (${maxPerDay}/day). Try again tomorrow.`,
          limit: maxPerDay,
          used: count,
        });
      }

      res.setHeader('X-RateLimit-Limit', String(maxPerDay));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxPerDay - count)));
      next();
    } catch (err) {
      logger.warn({ err, endpoint, userId }, 'AI rate limit check failed, allowing request');
      next();
    }
  };
}

export const voiceRateLimit = aiRateLimit({ endpoint: 'voice', maxPerDay: 50 });
export const insightsRefreshRateLimit = aiRateLimit({ endpoint: 'insights_refresh', maxPerDay: 3 });
export const foodLookupRateLimit = aiRateLimit({ endpoint: 'food_lookup', maxPerDay: 30 });
