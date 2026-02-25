import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkoutProvider } from './WorkoutContext';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Workout } from '@/types/workout';
import { workoutsApi } from '@/features/body/api';

vi.mock('@/features/body/api', () => ({
  workoutsApi: {
    list: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
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

const apiWorkouts = mockWorkouts.map((w) => ({
  id: w.id,
  date: w.date.toISOString().slice(0, 10),
  title: w.title,
  type: w.type,
  durationMinutes: w.durationMinutes,
  exercises: w.exercises,
  notes: w.notes,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('WorkoutContext', () => {
  let queryClient: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
    (workoutsApi.list as ReturnType<typeof vi.fn>).mockResolvedValue(apiWorkouts);
    (workoutsApi.add as ReturnType<typeof vi.fn>).mockImplementation((w: { title: string }) =>
      Promise.resolve({ id: 'new-id', date: '2025-01-17', title: w.title, type: 'strength', durationMinutes: 45, exercises: [] })
    );
    (workoutsApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...apiWorkouts[0],
      title: 'Updated Title',
    });
    (workoutsApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient!}>
      <WorkoutProvider>{children}</WorkoutProvider>
    </QueryClientProvider>
  );

  it('provides workouts from API', async () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    await waitFor(() => {
      expect(result.current.workouts).toHaveLength(1);
      expect(result.current.workouts[0].title).toBe('Chest Day');
      expect(result.current.workouts[0].id).toBe('1');
    });
  });

  it('adds new workout', async () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.addWorkout({
        date: new Date(2025, 0, 17),
        title: 'Leg Day',
        type: 'strength',
        durationMinutes: 45,
        exercises: [],
      });
    });

    expect(result.current.workouts).toHaveLength(2);
    expect(workoutsApi.add).toHaveBeenCalled();
  });

  it('updates existing workout', async () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    await waitFor(() => expect(result.current.workouts).toHaveLength(1));

    await act(async () => {
      await result.current.updateWorkout('1', { title: 'Updated Title' });
    });

    await waitFor(() => {
      const updated = result.current.workouts.find((w: Workout) => w.id === '1');
      expect(updated?.title).toBe('Updated Title');
    });
  });

  it('deletes workout', async () => {
    const { result } = renderHook(() => useWorkouts(), { wrapper });
    await waitFor(() => expect(result.current.workouts).toHaveLength(1));

    await act(async () => {
      await result.current.deleteWorkout('1');
    });

    await waitFor(() => expect(result.current.workouts).toHaveLength(0));
    expect(workoutsApi.delete).toHaveBeenCalledWith('1');
  });
});
