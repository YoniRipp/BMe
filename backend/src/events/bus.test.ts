import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/index.js', () => ({
  config: { isRedisConfigured: false },
}));

import { publish, subscribe } from './bus.js';

describe('event bus', () => {
  const sampleEvent = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'money.TransactionCreated',
    payload: { id: 'tx-1', amount: 10 },
    metadata: { userId: 'user-1', timestamp: '2025-02-24T12:00:00.000Z' },
  };

  beforeEach(() => {
    // Handlers are global; we just assert our handler is called. Other tests may add handlers.
  });

  it('publish resolves', async () => {
    await expect(publish(sampleEvent)).resolves.toBeUndefined();
  });

  it('invokes subscribe handler when event is published (in-memory)', async () => {
    const received = [];
    subscribe('money.TransactionCreated', (event) => {
      received.push(event);
    });
    await publish(sampleEvent);
    expect(received).toHaveLength(1);
    expect(received[0].eventId).toBe(sampleEvent.eventId);
    expect(received[0].type).toBe('money.TransactionCreated');
    expect(received[0].payload).toEqual(sampleEvent.payload);
  });

  it('idempotent consumer: same eventId processed twice leaves state correct once', async () => {
    const event = { ...sampleEvent, eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };
    const stateByEventId = new Map();
    subscribe('money.TransactionCreated', (ev) => {
      stateByEventId.set(ev.eventId, ev.payload);
    });
    await publish(event);
    await publish(event);
    expect(stateByEventId.size).toBe(1);
    expect(stateByEventId.get(event.eventId)).toEqual(sampleEvent.payload);
  });
});
