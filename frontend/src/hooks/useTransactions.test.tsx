import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionProvider } from '@/context/TransactionContext';
import { useTransactions } from './useTransactions';

vi.mock('@/features/money/api', () => ({
  transactionsApi: {
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

describe('useTransactions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TransactionProvider>{children}</TransactionProvider>
    </QueryClientProvider>
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
