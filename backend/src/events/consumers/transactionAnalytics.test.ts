import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/index.js', () => ({ config: { isRedisConfigured: false } }));
const { setExMock } = vi.hoisted(() => ({
  setExMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../redis/client.js', () => ({
  getRedisClient: vi.fn().mockResolvedValue({ setEx: setExMock }),
}));

import { subscribe, publish } from '../bus.js';
import { registerTransactionAnalyticsConsumer } from './transactionAnalytics.js';

describe('transaction analytics consumer', () => {
  beforeEach(() => {
    setExMock.mockClear();
  });

  it('updates Redis key on money.TransactionCreated', async () => {
    registerTransactionAnalyticsConsumer(subscribe);
    await publish({
      eventId: 'ev-1',
      type: 'money.TransactionCreated',
      payload: { id: 'tx-1', amount: 50, type: 'expense' },
      metadata: { userId: 'user-1', timestamp: '2025-02-24T12:00:00.000Z' },
    });
    expect(setExMock).toHaveBeenCalledTimes(1);
    expect(setExMock).toHaveBeenCalledWith('beme:lastTx:user-1', 86400, expect.any(String));
    const value = JSON.parse(setExMock.mock.calls[0][2]);
    expect(value.transactionId).toBe('tx-1');
    expect(value.amount).toBe(50);
    expect(value.eventId).toBe('ev-1');
  });
});
