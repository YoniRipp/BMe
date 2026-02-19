import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as transactionService from './transaction.js';
import * as transactionModel from '../models/transaction.js';
import { ValidationError } from '../errors.js';

vi.mock('../models/transaction.js', () => ({
  findByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  getBalance: vi.fn(),
}));

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
