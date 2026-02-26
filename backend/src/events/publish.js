/**
 * Helpers to publish domain events (envelope + metadata) after write operations.
 */
import crypto from 'crypto';
import { publish as busPublish } from './bus.js';

/**
 * Publish a domain event with standard envelope.
 * @param {string} type - Event type (e.g. 'money.TransactionCreated')
 * @param {Record<string, unknown>} payload - Domain payload
 * @param {string} userId - User who triggered the action
 * @param {{ correlationId?: string; causationId?: string }} [meta]
 */
export async function publishEvent(type, payload, userId, meta = {}) {
  await busPublish({
    eventId: crypto.randomUUID(),
    type,
    payload,
    metadata: {
      userId,
      timestamp: new Date().toISOString(),
      version: 1,
      ...(meta.correlationId && { correlationId: meta.correlationId }),
      ...(meta.causationId && { causationId: meta.causationId }),
    },
  });
}
