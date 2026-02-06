import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoals } from './useGoals';
import { GoalsProvider } from '@/context/GoalsContext';
import { AppProvider } from '@/context/AppContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { EnergyProvider } from '@/context/EnergyContext';

// Mock auth so AppProvider has a user (AppProvider calls useAuth())
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', email: 'a@b.com', name: 'Test', role: 'user' as const } }),
}));

// Mock dependencies
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => [[], vi.fn()],
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
  <AppProvider>
    <TransactionProvider>
      <WorkoutProvider>
        <EnergyProvider>
          <GoalsProvider>
            {children}
          </GoalsProvider>
        </EnergyProvider>
      </WorkoutProvider>
    </TransactionProvider>
  </AppProvider>
);

describe('useGoals', () => {
  it('returns goals context', () => {
    const { result } = renderHook(() => useGoals(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.goals).toBeDefined();
    expect(result.current.addGoal).toBeDefined();
    expect(result.current.updateGoal).toBeDefined();
    expect(result.current.deleteGoal).toBeDefined();
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGoals());
    }).toThrow('useGoals must be used within GoalsProvider');

    consoleSpy.mockRestore();
  });
});
