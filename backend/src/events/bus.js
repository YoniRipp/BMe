/**
 * Event bus: publish(event) and subscribe(eventType, handler).
 * Transport: EVENT_TRANSPORT=redis (default) uses BullMQ; EVENT_TRANSPORT=sqs uses SQS; no transport = in-memory sync (tests).
 */
import { Queue, Worker } from 'bullmq';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { createSqsTransport } from './transports/sqs.js';

const QUEUE_NAME = 'events';

/**
 * @typedef {{ eventId: string; type: string; payload: Record<string, unknown>; metadata: { userId: string; timestamp: string; correlationId?: string; causationId?: string } }} EventEnvelope
 */
/** @type {Map<string, Array<(event: EventEnvelope) => void | Promise<void>>>} */
const handlersByType = new Map();

let eventsQueue = null;
let eventsWorker = null;
let sqsConsumer = null;

function getHandlers(eventType) {
  return handlersByType.get(eventType) || [];
}

/** @returns {'memory' | 'redis' | 'sqs'} */
function getTransport() {
  if (config.eventTransport === 'sqs' && config.eventQueueUrl && config.awsRegion) return 'sqs';
  if (config.isRedisConfigured) return 'redis';
  return 'memory';
}

/**
 * Subscribe to an event type. Handler receives the full event envelope.
 * @param {string} eventType
 * @param {(event: EventEnvelope) => void | Promise<void>} handler
 */
export function subscribe(eventType, handler) {
  if (!handlersByType.has(eventType)) handlersByType.set(eventType, []);
  handlersByType.get(eventType).push(handler);
}

/**
 * Publish an event. Uses configured transport (redis, sqs, or in-memory).
 * @param {EventEnvelope} event
 * @returns {Promise<void>}
 */
export async function publish(event) {
  const transport = getTransport();
  if (transport === 'sqs') {
    const sqs = createSqsTransport({
      region: config.awsRegion,
      queueUrl: config.eventQueueUrl,
    });
    await sqs.publish(event);
    return;
  }
  if (transport === 'redis') {
    const queue = await getEventsQueue();
    if (queue) await queue.add(event.type, event, { removeOnComplete: true, removeOnFail: 100 });
    return;
  }
  const handlers = getHandlers(event.type);
  for (const h of handlers) {
    try {
      await Promise.resolve(h(event));
    } catch (err) {
      logger.error({ err, eventType: event.type, eventId: event.eventId }, 'Event handler error');
    }
  }
}

export async function getEventsQueue() {
  if (getTransport() !== 'redis') return null;
  if (!eventsQueue) {
    eventsQueue = new Queue(QUEUE_NAME, { connection: { url: config.redisUrl } });
  }
  return eventsQueue;
}

async function invokeHandlers(event) {
  const handlers = getHandlers(event?.type);
  for (const h of handlers) {
    try {
      await Promise.resolve(h(event));
    } catch (err) {
      logger.error({ err, eventType: event?.type, eventId: event?.eventId }, 'Event worker handler error');
      throw err;
    }
  }
}

/**
 * Start the events worker. Redis: BullMQ worker; SQS: long-poll consumer; otherwise null.
 */
export function startEventsWorker() {
  const transport = getTransport();
  if (transport === 'redis') {
    if (eventsWorker) return eventsWorker;
    eventsWorker = new Worker(
      QUEUE_NAME,
      async (job) => invokeHandlers(job.data),
      { connection: { url: config.redisUrl }, concurrency: 5 }
    );
    eventsWorker.on('error', (err) => logger.error({ err }, 'Events worker error'));
    return eventsWorker;
  }
  if (transport === 'sqs') {
    if (sqsConsumer) return sqsConsumer;
    const sqs = createSqsTransport({
      region: config.awsRegion,
      queueUrl: config.eventQueueUrl,
    });
    sqsConsumer = sqs.startConsumer((event) => invokeHandlers(event));
    return sqsConsumer;
  }
  return null;
}

export async function closeEventsBus() {
  if (eventsWorker) {
    await eventsWorker.close();
    eventsWorker = null;
  }
  if (sqsConsumer?.close) {
    await sqsConsumer.close();
    sqsConsumer = null;
  }
  if (eventsQueue) {
    await eventsQueue.close();
    eventsQueue = null;
  }
}
