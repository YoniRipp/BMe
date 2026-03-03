/**
 * Redis client. Optional; app runs without Redis when REDIS_URL is unset.
 */
import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;

export function isRedisConfigured() {
  return config.isRedisConfigured;
}

export async function getRedisClient() {
  if (!config.isRedisConfigured) return null;
  if (!client) {
    client = createClient({ url: config.redisUrl });
    client.on('error', (err: unknown) => logger.error({ err }, 'Redis error'));
    await client.connect();
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
