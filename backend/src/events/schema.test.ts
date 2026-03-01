import { describe, it, expect } from 'vitest';
import { parseEvent, safeParseEvent } from './schema.js';

describe('event envelope schema', () => {
  const validEvent = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'money.TransactionCreated',
    payload: {
      id: 'tx-1',
      date: '2025-02-24',
      type: 'expense',
      amount: 10.5,
      currency: 'USD',
      category: 'Food',
      description: 'Coffee',
    },
    metadata: {
      userId: 'user-123',
      timestamp: '2025-02-24T12:00:00.000Z',
      correlationId: 'req-abc',
    },
  };

  it('parses a valid event', () => {
    const result = parseEvent(validEvent);
    expect(result.eventId).toBe(validEvent.eventId);
    expect(result.type).toBe('money.TransactionCreated');
    expect(result.payload).toEqual(validEvent.payload);
    expect(result.metadata.userId).toBe('user-123');
  });

  it('safeParseEvent returns success for valid event', () => {
    const result = safeParseEvent(validEvent);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('money.TransactionCreated');
  });

  it('rejects event without eventId', () => {
    const invalid = { ...validEvent, eventId: undefined };
    expect(() => parseEvent(invalid)).toThrow();
    const safe = safeParseEvent(invalid);
    expect(safe.success).toBe(false);
  });

  it('rejects eventId that is not a UUID', () => {
    const invalid = { ...validEvent, eventId: 'not-a-uuid' };
    expect(() => parseEvent(invalid)).toThrow();
  });

  it('rejects event without type', () => {
    const invalid = { ...validEvent, type: '' };
    expect(() => parseEvent(invalid)).toThrow();
  });

  it('rejects event without metadata.userId', () => {
    const invalid = {
      ...validEvent,
      metadata: { ...validEvent.metadata, userId: undefined },
    };
    expect(() => parseEvent(invalid)).toThrow();
  });

  it('rejects event without metadata.timestamp', () => {
    const invalid = {
      ...validEvent,
      metadata: { ...validEvent.metadata, timestamp: undefined },
    };
    expect(() => parseEvent(invalid)).toThrow();
  });

  it('accepts optional correlationId and causationId', () => {
    const minimal = {
      eventId: validEvent.eventId,
      type: validEvent.type,
      payload: validEvent.payload,
      metadata: { userId: 'u1', timestamp: '2025-02-24T12:00:00.000Z' },
    };
    const result = parseEvent(minimal);
    expect(result.metadata.correlationId).toBeUndefined();
    expect(result.metadata.causationId).toBeUndefined();
  });
});
