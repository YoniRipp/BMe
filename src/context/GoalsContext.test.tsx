import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GoalsProvider, useGoals } from './GoalsContext';
import { Goal } from '@/types/goals';

// Mock dependencies
const mockSetGoals = vi.fn();
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [[], mockSetGoals]),
}));

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({ transactions: [] }),
}));

vi.mock('@/hooks/useWorkouts', () => ({
  useWorkouts: () => ({ workouts: [] }),
}));

vi.mock('@/hooks/useEnergy', () => ({
  useEnergy: () => ({ foodEntries: [] }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalsProvider>{children}</GoalsProvider>
);

describe('GoalsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides goals', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    expect(result.current.goals).toBeDefined();
    expect(Array.isArray(result.current.goals)).toBe(true);
  });

  it('adds goal', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    
    const newGoal: Omit<Goal, 'id' | 'createdAt'> = {
      type: 'calories',
      target: 2000,
      period: 'weekly',
    };

    act(() => {
      result.current.addGoal(newGoal);
    });

    expect(mockSetGoals).toHaveBeenCalled();
  });

  it('updates goal', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    
    act(() => {
      result.current.updateGoal('test-id', { target: 3000 });
    });

    expect(mockSetGoals).toHaveBeenCalled();
  });

  it('deletes goal', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    
    act(() => {
      result.current.deleteGoal('test-id');
    });

    expect(mockSetGoals).toHaveBeenCalled();
  });

  it('gets goal progress', () => {
    const mockGoals: Goal[] = [
      {
        id: 'test-id',
        type: 'calories',
        target: 2000,
        period: 'weekly',
        createdAt: new Date(),
      },
    ];

    vi.mocked(require('@/hooks/useLocalStorage').useLocalStorage).mockReturnValue([
      mockGoals,
      mockSetGoals,
    ]);

    const { result } = renderHook(() => useGoals(), { wrapper });
    
    const progress = result.current.getGoalProgress('test-id');
    expect(progress).toBeDefined();
    expect(progress.current).toBe(0);
    expect(progress.target).toBe(2000);
    expect(progress.percentage).toBe(0);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useGoals());
    }).toThrow('useGoals must be used within a GoalsProvider');
    
    consoleSpy.mockRestore();
  });
});
