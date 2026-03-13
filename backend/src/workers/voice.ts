/**
 * Voice job worker. Processes audio via Gemini and stores results in Redis.
 */
import { Worker } from 'bullmq';
import { config } from '../config/index.js';
import { getRedisClient } from '../redis/client.js';
import * as voiceService from '../services/voice.js';
import { logger } from '../lib/logger.js';
import { recordVoiceJob } from '../lib/metrics.js';

export function startVoiceWorker() {
  const worker = new Worker(
    'voice',
    async (job) => {
      const { jobId, audio, mimeType, userId, today, timezone } = job.data;
      const redis = await getRedisClient();
      if (!redis) {
        logger.error({ jobId }, 'Voice job failed: Redis not available');
        return;
      }

      const startTime = Date.now();
      try {
        const data = await voiceService.parseAudio(audio, mimeType, userId, {
          today: today || new Date().toISOString().slice(0, 10),
          timezone: timezone || 'UTC',
        });

        recordVoiceJob(Date.now() - startTime, true);

        await redis.setEx(
          `job:${jobId}`,
          300,
          JSON.stringify({
            status: 'completed',
            result: data,
            completedAt: Date.now(),
          })
        );
      } catch (e: unknown) {
        recordVoiceJob(Date.now() - startTime, false);
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
      connection: { url: config.redisUrl },
      concurrency: 5,
    }
  );

  worker.on('error', (err) => logger.error({ err }, 'Voice worker error'));

  return worker;
}
