import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { useWorkouts } from './useWorkouts';

describe('useWorkouts', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WorkoutProvider>{children}</WorkoutProvider>
  );

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
