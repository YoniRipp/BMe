/**
 * Voice job worker. Processes audio via Gemini and stores results in Redis.
 */
import { Worker } from 'bullmq';
import { config } from '../config/index.js';
import { getRedisClient } from '../redis/client.js';
import * as voiceService from '../services/voice.js';
import { logger } from '../lib/logger.js';

export function startVoiceWorker() {
  const worker = new Worker(
    'voice',
    async (job) => {
      const { jobId, audio, mimeType, userId, today, timezone } = job.data;
      const redis = await getRedisClient();

      try {
        const { actions } = await voiceService.parseAudio(audio, mimeType, userId, {
          today: today || new Date().toISOString().slice(0, 10),
          timezone: timezone || 'UTC',
        });

        await redis.setEx(
          `job:${jobId}`,
          300,
          JSON.stringify({
            status: 'completed',
            result: { actions },
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
            error: e?.message ?? 'Voice processing failed',
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
