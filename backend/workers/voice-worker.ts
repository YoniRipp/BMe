/**
 * Standalone voice worker process. Processes audio via Gemini and stores results in Redis.
 * Run when SEPARATE_WORKERS=true (e.g. on Railway as a separate service).
 *
 * Usage: npm run start:voice
 */
import { Worker } from 'bullmq';
import { config } from '../src/config/index.js';
import { getRedisClient, closeRedis } from '../src/redis/client.js';
import { closeQueue } from '../src/queue/index.js';
import * as voiceService from '../src/services/voice.js';
import { logger } from '../src/lib/logger.js';

const worker = new Worker(
  'voice',
  async (job) => {
    const { jobId, audio, mimeType, userId, today, timezone } = job.data;
    const redis = await getRedisClient();
    if (!redis) {
      logger.error({ jobId }, 'Voice job failed: Redis not available');
      throw new Error('Redis not available');
    }

    try {
      const data = await voiceService.parseAudio(audio, mimeType, userId, {
        today: today || new Date().toISOString().slice(0, 10),
        timezone: timezone || 'UTC',
      });

      await redis.setEx(
        `job:${jobId}`,
        300,
        JSON.stringify({
          status: 'completed',
          result: data,
          completedAt: Date.now(),
        })
      );
    } catch (e) {
      logger.error({ err: e, jobId }, 'Voice job failed');
      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade + 1 >= maxAttempts) {
        await redis.setEx(
          `job:${jobId}`,
          300,
          JSON.stringify({
            status: 'failed',
            error: (e as Error)?.message ?? 'Voice processing failed',
            completedAt: Date.now(),
          })
        );
      }
      throw e;
    }
  },
  {
    connection: { url: config.redisUrl! },
    concurrency: 5,
  }
);

worker.on('error', (err) => logger.error({ err }, 'Voice worker error'));
worker.on('failed', (job, err) => logger.error({ err, jobId: job?.data?.jobId }, 'Voice job attempt failed'));

async function shutdown() {
  logger.info('Voice worker shutting down');
  await worker.close();
  await closeQueue();
  await closeRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('Voice worker started');
