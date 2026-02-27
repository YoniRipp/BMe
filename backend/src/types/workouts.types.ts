import { z } from 'zod';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().int().positive('Sets must be positive'),
  reps: z.number().int().positive('Reps must be positive'),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

export const workoutTypeSchema = z.enum(['strength', 'cardio', 'flexibility', 'sports']);

export const createWorkoutSchema = z.object({
  date: z.coerce.date(),
  title: z.string().min(1, 'Title is required'),
  type: workoutTypeSchema,
  durationMinutes: z.number().int().positive('Duration must be positive'),
  exercises: z.array(exerciseSchema),
  notes: z.string().optional(),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();

export type CreateWorkoutDto = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutDto = z.infer<typeof updateWorkoutSchema>;