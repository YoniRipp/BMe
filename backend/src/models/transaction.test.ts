/**
 * Transaction model — findByUserId, create with mocked pool.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as transactionModel from './transaction.js';

const mockQuery = vi.fn();

vi.mock('../db/pool.js', () => ({
  getPool: () => ({ query: mockQuery }),
}));

describe('transaction model', () => {
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('queries with userId only when no opts', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await transactionModel.findByUserId(userId);

      expect(result).toEqual({ items: [], total: 0 });
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringMatching(/SELECT COUNT/), expect.anything());
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringMatching(/SELECT id, date/), expect.arrayContaining([userId, 500, 0]));
    });

    it('filters by month when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 't1', date: '2025-02-24', type: 'expense', amount: 10, currency: 'USD', category: 'Food', description: null, is_recurring: false, group_id: null },
            { id: 't2', date: '2025-02-20', type: 'income', amount: 100, currency: 'USD', category: 'Salary', description: null, is_recurring: false, group_id: null },
          ],
        });

      const result = await transactionModel.findByUserId(userId, { month: '2025-02' });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        id: 't1',
        date: '2025-02-24',
        type: 'expense',
        amount: 10,
        currency: 'USD',
        category: 'Food',
      });
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('date >='), expect.arrayContaining([userId, '2025-02']));
    });

    it('filters by type when income or expense', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 't1', date: '2025-02-24', type: 'expense', amount: 50, currency: 'USD', category: 'Other', description: null, is_recurring: false, group_id: null }],
        });

      const result = await transactionModel.findByUserId(userId, { type: 'expense' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('expense');
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('type ='), expect.anything());
    });

    it('uses limit and offset when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 100 }] })
        .mockResolvedValueOnce({ rows: [] });

      await transactionModel.findByUserId(userId, { limit: 10, offset: 20 });

      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringMatching(/LIMIT.*OFFSET/), expect.anything());
    });
  });

  describe('create', () => {
    it('returns created transaction with normalized fields', async () => {
      const row = {
        id: 'tx-new',
        date: '2025-02-24',
        type: 'expense',
        amount: 25.5,
        currency: 'USD',
        category: 'Food',
        description: 'Coffee',
        is_recurring: false,
        group_id: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [row] });

      const result = await transactionModel.create({
        userId,
        date: '2025-02-24',
        type: 'expense',
        amount: 25.5,
        currency: 'usd',
        category: 'Food',
        description: 'Coffee',
      });

      expect(result).toMatchObject({
        id: 'tx-new',
        date: '2025-02-24',
        type: 'expense',
        amount: 25.5,
        currency: 'USD',
        category: 'Food',
        description: 'Coffee',
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.arrayContaining(['2025-02-24', 'expense', 25.5, 'USD', 'Food', 'Coffee'])
      );
    });

    it('defaults currency to USD and category to Other', async () => {
      const row = {
        id: 'tx-1',
        date: '2025-02-24',
        type: 'income',
        amount: 100,
        currency: 'USD',
        category: 'Other',
        description: null,
        is_recurring: false,
        group_id: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [row] });

      await transactionModel.create({
        userId,
        type: 'income',
        amount: 100,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['USD', 'Other'])
      );
    });
  });
});
