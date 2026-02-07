import { Workout } from '@/types/workout';

export function apiWorkoutToWorkout(a: {
  id: string;
  date: string;
  title: string;
  type: string;
  durationMinutes: number;
  exercises: { name: string; sets: number; reps: number; weight?: number; notes?: string }[];
  notes?: string;
}): Workout {
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
