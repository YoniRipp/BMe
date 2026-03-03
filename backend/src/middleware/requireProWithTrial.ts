/**
 * Like requirePro, but allows free users a limited number of voice commands
 * per month (5 by default) as a conversion hook.
 *
 * Uses Redis when available; falls back to in-memory counters.
 */
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { getRedisClient, isRedisConfigured } from '../redis/client.js';
import { logger } from '../lib/logger.js';

const FREE_MONTHLY_LIMIT = 5;

const inMemoryCounters = new Map<string, { count: number; expiresAt: number }>();

function monthKey(userId: string): string {
  const d = new Date();
  return `voice_trial:${userId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function getAndIncrementUsage(userId: string): Promise<number> {
  const key = monthKey(userId);

  if (isRedisConfigured()) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const count = await redis.incr(key);
        if (count === 1) {
          const now = new Date();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const ttl = Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
          await redis.expire(key, ttl);
        }
        return count;
      }
    } catch (err) {
      logger.warn({ err }, 'Redis unavailable for voice trial counter');
    }
  }

  const now = Date.now();
  const entry = inMemoryCounters.get(key);
  if (entry && entry.expiresAt > now) {
    entry.count += 1;
    return entry.count;
  }
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  inMemoryCounters.set(key, { count: 1, expiresAt: endOfMonth.getTime() });
  return 1;
}

export async function requireProWithTrial(req, res, next) {
  if (!config.lemonSqueezyApiKey) {
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [req.user.id],
    );

    const status = rows[0]?.subscription_status || 'free';
    if (status === 'pro') {
      return next();
    }

    const usage = await getAndIncrementUsage(req.user.id);
    if (usage <= FREE_MONTHLY_LIMIT) {
      res.setHeader('X-Voice-Trial-Remaining', String(FREE_MONTHLY_LIMIT - usage));
      return next();
    }

    return res.status(403).json({
      error: 'Free voice trial exhausted',
      detail: `You've used all ${FREE_MONTHLY_LIMIT} free voice commands this month. Upgrade to Pro for unlimited access.`,
      upgradeUrl: '/pricing',
      trialUsed: usage,
      trialLimit: FREE_MONTHLY_LIMIT,
    });
  } catch (e) {
    next(e);
  }
}
