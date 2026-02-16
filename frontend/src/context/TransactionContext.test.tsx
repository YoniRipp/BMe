import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionProvider } from './TransactionContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/types/transaction';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockTransactionsApi = [
  { id: '1', date: '2025-01-15', type: 'income' as const, amount: 1000, category: 'Salary', description: 'Monthly salary', isRecurring: true },
];

const mockList = vi.fn().mockResolvedValue(mockTransactionsApi);
const mockAdd = vi.fn().mockImplementation((tx: { type: string; amount: number; category?: string }) =>
  Promise.resolve({ id: '2', date: '2025-01-16', type: tx.type, amount: tx.amount, category: tx.category ?? 'Other', description: null, isRecurring: false })
);
const mockUpdate = vi.fn().mockImplementation((id: string, updates: { amount?: number }) =>
  Promise.resolve({ ...mockTransactionsApi[0], id, amount: updates.amount ?? 1000 })
);
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/money/api', () => ({
  transactionsApi: {
    list: () => mockList(),
    add: (tx: unknown) => mockAdd(tx),
    update: (id: string, updates: unknown) => mockUpdate(id, updates),
    delete: (id: string) => mockDelete(id),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TransactionProvider>{children}</TransactionProvider>
  </QueryClientProvider>
);

describe('TransactionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockTransactionsApi);
    queryClient.clear();
  });

  it('provides transactions from API', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.transactionsLoading).toBe(false));
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].amount).toBe(1000);
  });

  it('adds new transaction via API', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.transactionsLoading).toBe(false));

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

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalled();
      expect(result.current.transactions.length).toBe(2);
    });
  });

  it('updates existing transaction via API', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.transactionsLoading).toBe(false));

    act(() => {
      result.current.updateTransaction('1', { amount: 1500 });
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ amount: 1500 })));
  });

  it('deletes transaction via API', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.transactionsLoading).toBe(false));

    act(() => {
      result.current.deleteTransaction('1');
    });

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('1'));
  });

  it('gets transaction by id', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.transactionsLoading).toBe(false));
    const transaction = result.current.getTransactionById('1');
    expect(transaction).toBeDefined();
    expect(transaction?.amount).toBe(1000);
  });
});
