import { z } from 'zod';

export const goalTypeSchema = z.enum(['calories', 'workouts', 'savings']);
export const goalPeriodSchema = z.enum(['weekly', 'monthly', 'yearly']);

export const createGoalSchema = z.object({
  type: goalTypeSchema,
  target: z.number().positive('Target must be positive'),
  period: goalPeriodSchema,
});

export const updateGoalSchema = createGoalSchema.partial();

export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;