import React, { createContext, useCallback } from 'react';
import { Workout } from '@/types/workout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { SAMPLE_WORKOUTS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface WorkoutContextType {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id'>) => void;
  updateWorkout: (id: string, workout: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  getWorkoutById: (id: string) => Workout | undefined;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const initializeWorkouts = () => {
    const existing = storage.get<Workout[]>(STORAGE_KEYS.WORKOUTS);
    return existing || SAMPLE_WORKOUTS;
  };

  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(
    STORAGE_KEYS.WORKOUTS,
    initializeWorkouts()
  );

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: generateId(),
    };
    setWorkouts(prev => [...prev, newWorkout]);
  }, [setWorkouts]);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setWorkouts(prev =>
      prev.map(w => w.id === id ? { ...w, ...updates } : w)
    );
  }, [setWorkouts]);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }, [setWorkouts]);

  const getWorkoutById = useCallback((id: string) => {
    return workouts.find(w => w.id === id);
  }, [workouts]);

  return (
    <WorkoutContext.Provider value={{
      workouts,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      getWorkoutById
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}
