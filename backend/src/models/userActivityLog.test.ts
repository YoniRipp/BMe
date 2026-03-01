import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db/index.js', () => ({
  getPool: vi.fn(),
}));

import { getPool } from '../db/index.js';
import { listActivity } from './userActivityLog.js';

describe('userActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listActivity', () => {
    it('throws when from is missing', async () => {
      await expect(listActivity({ to: '2025-02-24T00:00:00.000Z' })).rejects.toThrow(
        'from and to (ISO UTC) are required'
      );
      expect(getPool).not.toHaveBeenCalled();
    });

    it('throws when to is missing', async () => {
      await expect(listActivity({ from: '2025-02-23T00:00:00.000Z' })).rejects.toThrow(
        'from and to (ISO UTC) are required'
      );
      expect(getPool).not.toHaveBeenCalled();
    });

    it('throws when from and to are both empty strings', async () => {
      await expect(listActivity({ from: '', to: '' })).rejects.toThrow(
        'from and to (ISO UTC) are required'
      );
      expect(getPool).not.toHaveBeenCalled();
    });

    it('throws for invalid ISO dates', async () => {
      await expect(listActivity({ from: 'invalid', to: '2025-02-24T00:00:00.000Z' })).rejects.toThrow(
        'from and to must be valid ISO 8601 dates'
      );
      await expect(listActivity({ from: '2025-02-23T00:00:00.000Z', to: 'invalid' })).rejects.toThrow(
        'from and to must be valid ISO 8601 dates'
      );
      expect(getPool).not.toHaveBeenCalled();
    });

    it('throws when time range exceeds 90 days', async () => {
      await expect(
        listActivity({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-04-10T00:00:00.000Z',
        })
      ).rejects.toThrow('Time range cannot exceed 90 days');
      expect(getPool).not.toHaveBeenCalled();
    });

    it('throws when to is before or equal to from', async () => {
      await expect(
        listActivity({
          from: '2025-02-24T00:00:00.000Z',
          to: '2025-02-23T00:00:00.000Z',
        })
      ).rejects.toThrow('to must be after from');

      await expect(
        listActivity({
          from: '2025-02-24T00:00:00.000Z',
          to: '2025-02-24T00:00:00.000Z',
        })
      ).rejects.toThrow('to must be after from');
      expect(getPool).not.toHaveBeenCalled();
    });

    it('returns events with correct shape when mock returns rows', async () => {
      const rows = [
        {
          id: 'ev-1',
          user_id: 'u1',
          event_type: 'money.TransactionCreated',
          event_id: 'evid-1',
          summary: 'Created expense',
          payload: { amount: 50 },
          created_at: '2025-02-24T12:00:00.000Z',
          user_email: 'u1@example.com',
          user_name: 'User One',
        },
      ];
      const mockQuery = vi.fn().mockResolvedValue({ rows });
      getPool.mockReturnValue({ query: mockQuery });

      const result = await listActivity({
        from: '2025-02-23T00:00:00.000Z',
        to: '2025-02-24T23:59:59.999Z',
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        id: 'ev-1',
        eventType: 'money.TransactionCreated',
        eventId: 'evid-1',
        summary: 'Created expense',
        payload: { amount: 50 },
        createdAt: '2025-02-24T12:00:00.000Z',
        userId: 'u1',
        userEmail: 'u1@example.com',
        userName: 'User One',
      });
      expect(result.nextCursor).toBeUndefined();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM user_activity_log'),
        ['2025-02-23T00:00:00.000Z', '2025-02-24T23:59:59.999Z']
      );
    });

    it('returns nextCursor when rows exceed limit', async () => {
      const rows = Array(6)
        .fill(null)
        .map((_, i) => ({
          id: `ev-${i}`,
          user_id: 'u1',
          event_type: 'auth.Login',
          event_id: `evid-${i}`,
          summary: 'Login',
          payload: null,
          created_at: '2025-02-24T12:00:00.000Z',
          user_email: 'u1@example.com',
          user_name: 'User One',
        }));
      const mockQuery = vi.fn().mockResolvedValue({ rows });
      getPool.mockReturnValue({ query: mockQuery });

      const result = await listActivity({
        from: '2025-02-23T00:00:00.000Z',
        to: '2025-02-24T23:59:59.999Z',
        limit: 5,
      });

      expect(result.events).toHaveLength(5);
      expect(result.nextCursor).toBeDefined();
      expect(typeof result.nextCursor).toBe('string');
    });

    it('passes userId and eventType filters to query', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
      getPool.mockReturnValue({ query: mockQuery });

      await listActivity({
        from: '2025-02-23T00:00:00.000Z',
        to: '2025-02-24T23:59:59.999Z',
        userId: 'user-123',
        eventType: 'money.',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $3'),
        ['2025-02-23T00:00:00.000Z', '2025-02-24T23:59:59.999Z', 'user-123', 'money.%']
      );
    });

    it('passes before cursor to keyset pagination', async () => {
      const cursorPayload = { c: '2025-02-24T12:00:00.000Z', i: 'ev-99' };
      const before = Buffer.from(JSON.stringify(cursorPayload), 'utf8').toString('base64url');
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
      getPool.mockReturnValue({ query: mockQuery });

      await listActivity({
        from: '2025-02-23T00:00:00.000Z',
        to: '2025-02-24T23:59:59.999Z',
        before,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('created_at, a.id) <'),
        ['2025-02-23T00:00:00.000Z', '2025-02-24T23:59:59.999Z', '2025-02-24T12:00:00.000Z', 'ev-99']
      );
    });

    it('ignores invalid before cursor without crashing', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
      getPool.mockReturnValue({ query: mockQuery });

      const result = await listActivity({
        from: '2025-02-23T00:00:00.000Z',
        to: '2025-02-24T23:59:59.999Z',
        before: 'invalid-base64!!!',
      });

      expect(result.events).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('a.created_at >= $1'),
        ['2025-02-23T00:00:00.000Z', '2025-02-24T23:59:59.999Z']
      );
    });
  });
});
