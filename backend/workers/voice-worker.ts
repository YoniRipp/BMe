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
  },
  {
    connection: { url: config.redisUrl! },
    concurrency: 5,
  }
);

worker.on('error', (err) => logger.error({ err }, 'Voice worker error'));

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
