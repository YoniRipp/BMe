/**
 * Queue abstraction. Uses BullMQ when Redis configured, or SQS when VOICE_QUEUE_URL set.
 */
import { Queue } from 'bullmq';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config/index.js';

let voiceQueue: Queue | null = null;
let sqsClient: SQSClient | null = null;

export async function getVoiceQueue() {
  if (config.voiceQueueUrl) return null;
  if (!voiceQueue && config.isRedisConfigured) {
    voiceQueue = new Queue('voice', {
      connection: { url: config.redisUrl! },
    });
  }
  return voiceQueue;
}

export async function enqueue(jobType: string, data: Record<string, unknown>) {
  if (config.voiceQueueUrl && config.awsRegion) {
    if (!sqsClient) sqsClient = new SQSClient({ region: config.awsRegion });
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: config.voiceQueueUrl,
        MessageBody: JSON.stringify({ jobType, ...data }),
      })
    );
    return;
  }
  const queue = await getVoiceQueue();
  if (!queue) {
    throw new Error('Queue not configured (REDIS_URL or VOICE_QUEUE_URL required)');
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
