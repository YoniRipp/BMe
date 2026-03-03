import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGoals } from './useGoals';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

vi.mock('@/features/goals/api', () => ({
  goalsApi: { list: vi.fn().mockResolvedValue([]), add: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useGoals', () => {
  it('returns goals data and mutations', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.goals).toBeDefined();
    expect(result.current.addGoal).toBeDefined();
    expect(result.current.updateGoal).toBeDefined();
    expect(result.current.deleteGoal).toBeDefined();
  });
});
