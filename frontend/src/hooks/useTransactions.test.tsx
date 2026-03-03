import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions } from '@/features/money/useTransactions';

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
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides transactions data and mutations', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    expect(result.current).toHaveProperty('transactions');
    expect(result.current).toHaveProperty('addTransaction');
    expect(result.current).toHaveProperty('updateTransaction');
    expect(result.current).toHaveProperty('deleteTransaction');
  });
});
