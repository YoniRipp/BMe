import React, { createContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workout } from '@/types/workout';
import { workoutsApi } from '@/features/body/api';
import { apiWorkoutToWorkout } from '@/features/body/mappers';
import { queryKeys } from '@/lib/queryClient';

interface WorkoutContextType {
  workouts: Workout[];
  workoutsLoading: boolean;
  workoutsError: string | null;
  refetchWorkouts: () => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
  updateWorkout: (id: string, workout: Partial<Workout>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: workouts = [],
    isLoading: workoutsLoading,
    error: workoutsQueryError,
    refetch: refetchWorkoutsQuery,
  } = useQuery({
    queryKey: queryKeys.workouts,
    queryFn: async () => {
      const list = await workoutsApi.list();
      return list.map(apiWorkoutToWorkout);
    },
  });

  const workoutsError = workoutsQueryError
    ? (workoutsQueryError instanceof Error ? workoutsQueryError.message : 'Failed to load workouts')
    : null;

  const refetchWorkouts = useCallback(async () => {
    await refetchWorkoutsQuery();
  }, [refetchWorkoutsQuery]);

  const addMutation = useMutation({
    mutationFn: (workout: Omit<Workout, 'id'>) =>
      workoutsApi.add({
        date: workout.date.toISOString().slice(0, 10),
        title: workout.title,
        type: workout.type,
        durationMinutes: workout.durationMinutes,
        exercises: workout.exercises,
        notes: workout.notes,
      }),
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.workouts, (prev: Workout[] | undefined) =>
        prev ? [...prev, apiWorkoutToWorkout(created)] : [apiWorkoutToWorkout(created)]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Workout> }) => {
      const body: Record<string, unknown> = {};
      if (updates.date !== undefined) body.date = updates.date.toISOString().slice(0, 10);
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.durationMinutes !== undefined) body.durationMinutes = updates.durationMinutes;
      if (updates.exercises !== undefined) body.exercises = updates.exercises;
      if (updates.notes !== undefined) body.notes = updates.notes;
      return workoutsApi.update(id, body);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.workouts, (prev: Workout[] | undefined) =>
        prev ? prev.map((w) => (w.id === updated.id ? apiWorkoutToWorkout(updated) : w)) : [apiWorkoutToWorkout(updated)]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.workouts, (prev: Workout[] | undefined) =>
        prev ? prev.filter((w) => w.id !== id) : []
      );
    },
  });

  const addWorkout = useCallback(
    (workout: Omit<Workout, 'id'>): Promise<void> =>
      addMutation.mutateAsync(workout).then(() => undefined),
    [addMutation]
  );

  const updateWorkout = useCallback(
    (id: string, updates: Partial<Workout>): Promise<void> =>
      updateMutation.mutateAsync({ id, updates }).then(() => undefined),
    [updateMutation]
  );

  const deleteWorkout = useCallback(
    (id: string): Promise<void> => deleteMutation.mutateAsync(id).then(() => undefined),
    [deleteMutation]
  );

  const getWorkoutById = useCallback(
    (id: string) => workouts.find((w) => w.id === id),
    [workouts]
  );

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        workoutsLoading,
        workoutsError,
        refetchWorkouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        getWorkoutById,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}
