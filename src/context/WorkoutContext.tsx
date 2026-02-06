import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Workout } from '@/types/workout';
import { workoutsApi } from '@/lib/api';

interface WorkoutContextType {
  workouts: Workout[];
  workoutsLoading: boolean;
  workoutsError: string | null;
  refetchWorkouts: () => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id'>) => void;
  updateWorkout: (id: string, workout: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  getWorkoutById: (id: string) => Workout | undefined;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

function apiToWorkout(a: { id: string; date: string; title: string; type: string; durationMinutes: number; exercises: { name: string; sets: number; reps: number; weight?: number; notes?: string }[]; notes?: string }): Workout {
  return {
    id: a.id,
    date: new Date(a.date),
    title: a.title,
    type: a.type as Workout['type'],
    durationMinutes: a.durationMinutes,
    exercises: a.exercises ?? [],
    notes: a.notes,
  };
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);

  const refetchWorkouts = useCallback(async () => {
    setWorkoutsLoading(true);
    setWorkoutsError(null);
    try {
      const list = await workoutsApi.list();
      setWorkouts(list.map(apiToWorkout));
    } catch (e) {
      setWorkoutsError(e instanceof Error ? e.message : 'Failed to load workouts');
      setWorkouts([]);
    } finally {
      setWorkoutsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchWorkouts();
  }, [refetchWorkouts]);

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    setWorkoutsError(null);
    workoutsApi.add({
      date: workout.date.toISOString().slice(0, 10),
      title: workout.title,
      type: workout.type,
      durationMinutes: workout.durationMinutes,
      exercises: workout.exercises,
      notes: workout.notes,
    }).then(created => {
      setWorkouts(prev => [...prev, apiToWorkout(created)]);
    }).catch(e => {
      setWorkoutsError(e instanceof Error ? e.message : 'Failed to add workout');
    });
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setWorkoutsError(null);
    const body: Record<string, unknown> = {};
    if (updates.date !== undefined) body.date = updates.date.toISOString().slice(0, 10);
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.type !== undefined) body.type = updates.type;
    if (updates.durationMinutes !== undefined) body.durationMinutes = updates.durationMinutes;
    if (updates.exercises !== undefined) body.exercises = updates.exercises;
    if (updates.notes !== undefined) body.notes = updates.notes;
    workoutsApi.update(id, body).then(updated => {
      setWorkouts(prev => prev.map(w => w.id === id ? apiToWorkout(updated) : w));
    }).catch(e => {
      setWorkoutsError(e instanceof Error ? e.message : 'Failed to update workout');
    });
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkoutsError(null);
    workoutsApi.delete(id).then(() => {
      setWorkouts(prev => prev.filter(w => w.id !== id));
    }).catch(e => {
      setWorkoutsError(e instanceof Error ? e.message : 'Failed to delete workout');
    });
  }, []);

  const getWorkoutById = useCallback((id: string) => {
    return workouts.find(w => w.id === id);
  }, [workouts]);

  return (
    <WorkoutContext.Provider value={{
      workouts,
      workoutsLoading,
      workoutsError,
      refetchWorkouts,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      getWorkoutById,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}
