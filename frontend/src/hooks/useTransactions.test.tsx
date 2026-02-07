import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TransactionProvider } from '@/context/TransactionContext';
import { useTransactions } from './useTransactions';
import { Transaction } from '@/types/transaction';

// Mock storage
vi.mock('@/lib/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
  STORAGE_KEYS: {
    TRANSACTIONS: 'test_transactions',
  },
}));

describe('useTransactions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TransactionProvider>{children}</TransactionProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides transactions from context', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    expect(result.current).toHaveProperty('transactions');
    expect(result.current).toHaveProperty('addTransaction');
    expect(result.current).toHaveProperty('updateTransaction');
    expect(result.current).toHaveProperty('deleteTransaction');
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useTransactions());
    }).toThrow('useTransactions must be used within TransactionProvider');
  });
});
