import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WorkoutProvider, useWorkouts } from './WorkoutContext';
import { Workout } from '@/types/workout';
import { storage, STORAGE_KEYS } from '@/lib/storage';

vi.mock('@/lib/storage');
vi.mock('@/lib/utils', () => ({
  generateId: () => 'test-id-123',
}));

const mockWorkouts: Workout[] = [
  {
    id: '1',
    date: new Date(2025, 0, 16),
    title: 'Chest Day',
    type: 'strength',
    durationMinutes: 60,
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
    ],
  },
];

describe('WorkoutContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.get as any).mockReturnValue(mockWorkouts);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WorkoutProvider>{children}</WorkoutProvider>
  );

  it('provides workouts from storage', () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    expect(result.current.workouts).toEqual(mockWorkouts);
  });

  it('adds new workout', () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    
    act(() => {
      result.current.addWorkout({
        date: new Date(2025, 0, 17),
        title: 'Leg Day',
        type: 'strength',
        durationMinutes: 45,
        exercises: [],
      });
    });

    expect(result.current.workouts).toHaveLength(2);
    expect(storage.set).toHaveBeenCalled();
  });

  it('updates existing workout', () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    
    act(() => {
      result.current.updateWorkout('1', { title: 'Updated Title' });
    });

    const updated = result.current.workouts.find(w => w.id === '1');
    expect(updated?.title).toBe('Updated Title');
  });

  it('deletes workout', () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    
    act(() => {
      result.current.deleteWorkout('1');
    });

    expect(result.current.workouts).toHaveLength(0);
  });
});
