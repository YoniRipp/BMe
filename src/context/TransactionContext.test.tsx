import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TransactionProvider, useTransactions } from './TransactionContext';
import { Transaction } from '@/types/transaction';
import { storage, STORAGE_KEYS } from '@/lib/storage';

vi.mock('@/lib/storage');
vi.mock('@/lib/utils', () => ({
  generateId: () => 'test-id-123',
}));

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date(2025, 0, 15),
    type: 'income',
    amount: 1000,
    category: 'Salary',
    description: 'Monthly salary',
    isRecurring: true,
  },
];

describe('TransactionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.get as any).mockReturnValue(mockTransactions);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TransactionProvider>{children}</TransactionProvider>
  );

  it('provides transactions from storage', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    expect(result.current.transactions).toEqual(mockTransactions);
  });

  it('adds new transaction', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    
    act(() => {
      result.current.addTransaction({
        date: new Date(2025, 0, 16),
        type: 'expense',
        amount: 50,
        category: 'Food',
        description: 'Lunch',
        isRecurring: false,
      });
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(storage.set).toHaveBeenCalled();
  });

  it('updates existing transaction', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    
    act(() => {
      result.current.updateTransaction('1', { amount: 1500 });
    });

    const updated = result.current.transactions.find(t => t.id === '1');
    expect(updated?.amount).toBe(1500);
    expect(storage.set).toHaveBeenCalled();
  });

  it('deletes transaction', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    
    act(() => {
      result.current.deleteTransaction('1');
    });

    expect(result.current.transactions).toHaveLength(0);
    expect(storage.set).toHaveBeenCalled();
  });

  it('gets transaction by id', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    const transaction = result.current.getTransactionById('1');
    expect(transaction).toEqual(mockTransactions[0]);
  });
});
