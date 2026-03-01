import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as transactionModel from '../models/transaction.js';
import { ValidationError } from '../errors.js';

vi.mock('../config/index.js', () => ({
  config: { isRedisConfigured: false },
}));
vi.mock('../models/transaction.js', () => ({
  findByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  getBalance: vi.fn(),
}));

import * as transactionService from './transaction.js';
import { subscribe } from '../events/bus.js';

describe('transaction service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('normalizes and creates transaction', async () => {
      const created = { id: '1', type: 'expense', amount: 50, category: 'Food' };
      transactionModel.create.mockResolvedValue(created);

      const result = await transactionService.create('user-1', {
        type: 'expense',
        amount: 50,
        category: 'Food',
      });

      expect(result).toEqual(created);
      expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'expense',
          amount: 50,
          category: 'Food',
          currency: 'USD',
        })
      );
    });

    it('throws for invalid type', async () => {
      await expect(
        transactionService.create('user-1', { type: 'invalid', amount: 10 })
      ).rejects.toThrow(ValidationError);
      expect(transactionModel.create).not.toHaveBeenCalled();
    });

    it('throws for negative amount', async () => {
      await expect(
        transactionService.create('user-1', { type: 'expense', amount: -10 })
      ).rejects.toThrow(ValidationError);
      expect(transactionModel.create).not.toHaveBeenCalled();
    });

    it('publishes money.TransactionCreated event after create', async () => {
      const created = { id: 'tx-1', date: '2025-02-24', type: 'expense', amount: 50, currency: 'USD', category: 'Food' };
      transactionModel.create.mockResolvedValue(created);
      const received = [];
      subscribe('money.TransactionCreated', (event) => received.push(event));

      await transactionService.create('user-1', { type: 'expense', amount: 50, category: 'Food' });

      expect(received).toHaveLength(1);
      expect(received[0].type).toBe('money.TransactionCreated');
      expect(received[0].payload).toEqual(created);
      expect(received[0].metadata.userId).toBe('user-1');
      expect(received[0].eventId).toBeDefined();
    });
  });

  describe('getBalance', () => {
    it('delegates to model', async () => {
      transactionModel.getBalance.mockResolvedValue({ balance: 100 });

      const result = await transactionService.getBalance('user-1', '2025-01');

      expect(result).toEqual({ balance: 100 });
      expect(transactionModel.getBalance).toHaveBeenCalledWith('user-1', '2025-01');
    });
  });
});
