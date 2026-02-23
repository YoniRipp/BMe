import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { useWorkouts } from './useWorkouts';

vi.mock('@/features/body/api', () => ({
  workoutsApi: {
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

describe('useWorkouts', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WorkoutProvider>{children}</WorkoutProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides workouts from context', () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    expect(result.current).toHaveProperty('workouts');
    expect(result.current).toHaveProperty('addWorkout');
    expect(result.current).toHaveProperty('updateWorkout');
    expect(result.current).toHaveProperty('deleteWorkout');
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useWorkouts());
    }).toThrow('useWorkouts must be used within WorkoutProvider');
  });
});
