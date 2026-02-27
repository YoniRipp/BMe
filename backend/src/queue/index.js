/**
 * Queue abstraction (BullMQ). Requires Redis.
 */
import { Queue } from 'bullmq';
import { config } from '../config/index.js';

let voiceQueue = null;

export async function getVoiceQueue() {
  if (!voiceQueue && config.isRedisConfigured) {
    voiceQueue = new Queue('voice', {
      connection: { url: config.redisUrl },
    });
  }
  return voiceQueue;
}

export async function enqueue(jobType, data) {
  const queue = await getVoiceQueue();
  if (!queue) {
    throw new Error('Queue not configured (REDIS_URL required)');
  }
  await queue.add(jobType, data, {
    removeOnComplete: true,
    removeOnFail: 100,
  });
}

export async function closeQueue() {
  if (voiceQueue) {
    await voiceQueue.close();
    voiceQueue = null;
  }
}
