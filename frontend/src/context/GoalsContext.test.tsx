import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoalsProvider } from './GoalsContext';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/goals';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockList = vi.fn().mockResolvedValue([]);
const mockAdd = vi.fn().mockImplementation((goal: { type: string; target: number; period: string }) =>
  Promise.resolve({ id: 'new-id', type: goal.type, target: goal.target, period: goal.period, createdAt: new Date().toISOString() })
);
const mockUpdate = vi.fn().mockResolvedValue({ id: 'test-id', type: 'calories', target: 3000, period: 'weekly', createdAt: new Date().toISOString() });
const mockDelete = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/goals/api', () => ({
  goalsApi: {
    list: () => mockList(),
    add: (goal: unknown) => mockAdd(goal),
    update: (id: string, updates: unknown) => mockUpdate(id, updates),
    delete: (id: string) => mockDelete(id),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <GoalsProvider>{children}</GoalsProvider>
  </QueryClientProvider>
);

describe('GoalsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
    queryClient.clear();
  });

  it('provides goals and loading state', async () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    expect(result.current.goals).toBeDefined();
    expect(Array.isArray(result.current.goals)).toBe(true);
    await waitFor(() => expect(result.current.goalsLoading).toBe(false));
  });

  it('adds goal via API', async () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    await waitFor(() => expect(result.current.goalsLoading).toBe(false));

    const newGoal: Omit<Goal, 'id' | 'createdAt'> = {
      type: 'calories',
      target: 2000,
      period: 'weekly',
    };

    act(() => {
      result.current.addGoal(newGoal);
    });

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith({ type: 'calories', target: 2000, period: 'weekly' });
      expect(result.current.goals.length).toBe(1);
    });
  });

  it('updates goal via API', async () => {
    mockList.mockResolvedValue([{ id: 'test-id', type: 'calories', target: 2000, period: 'weekly', createdAt: new Date().toISOString() }]);
    const { result } = renderHook(() => useGoals(), { wrapper });
    await waitFor(() => expect(result.current.goalsLoading).toBe(false));

    act(() => {
      result.current.updateGoal('test-id', { target: 3000 });
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('test-id', { target: 3000 }));
  });

  it('deletes goal via API', async () => {
    mockList.mockResolvedValue([{ id: 'test-id', type: 'calories', target: 2000, period: 'weekly', createdAt: new Date().toISOString() }]);
    const { result } = renderHook(() => useGoals(), { wrapper });
    await waitFor(() => expect(result.current.goalsLoading).toBe(false));

    act(() => {
      result.current.deleteGoal('test-id');
    });

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('test-id'));
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGoals());
    }).toThrow('useGoals must be used within GoalsProvider');

    consoleSpy.mockRestore();
  });
});
