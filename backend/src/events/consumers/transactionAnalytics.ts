/**
 * Consumer: on money.TransactionCreated, update Redis with last transaction for user (e.g. for analytics/cache).
 * Runs in the same process as the API. Idempotent by eventId (we overwrite the same key).
 */
import { getRedisClient } from '../../redis/client.js';
import { logger } from '../../lib/logger.js';
import { EventEnvelope } from '../dispatcher.js';

const KEY_PREFIX = 'beme:lastTx:';
const TTL_SECONDS = 86400; // 24h

type SubscribeFn = (eventType: string, handler: (event: EventEnvelope) => Promise<void> | void) => void;

export function registerTransactionAnalyticsConsumer(subscribe: SubscribeFn) {
  subscribe('money.TransactionCreated', async (event: EventEnvelope) => {
    const userId = event.metadata?.userId;
    if (!userId) return;
    try {
      const redis = await getRedisClient();
      if (redis) {
        const key = `${KEY_PREFIX}${userId}`;
        const value = JSON.stringify({
          eventId: event.eventId,
          transactionId: event.payload?.id,
          amount: event.payload?.amount,
          type: event.payload?.type,
          at: event.metadata?.timestamp,
        });
        await redis.setEx(key, TTL_SECONDS, value);
      }
    } catch (err) {
      logger.error({ err, eventId: event.eventId }, 'Transaction analytics consumer failed');
    }
  });
}
