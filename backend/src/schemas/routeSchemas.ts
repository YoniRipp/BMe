/**
 * Route-level Zod schemas — single source of validation truth.
 * These are the authoritative validators. Services should NOT re-validate.
 */
import { z } from 'zod';

// ─── Shared primitives ─────────────────────────────────────
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').refine((s) => {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}, 'Invalid calendar date');

const timeString = z.string().regex(/^\d{1,2}:\d{2}$/, 'Time must be HH:MM format').optional().nullable();

const workoutType = z.enum(['strength', 'cardio', 'flexibility', 'sports']);
const goalType = z.enum(['calories', 'workouts', 'sleep']);
const goalPeriod = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

const exerciseSchema = z.object({
  name: z.string().min(1).max(200),
  sets: z.number().int().min(0).max(999),
  reps: z.number().int().min(0).max(999),
  repsPerSet: z.array(z.number().int().min(0)).optional(),
  weight: z.number().min(0).max(9999).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Pagination ─────────────────────────────────────────────
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Workout schemas ────────────────────────────────────────
export const createWorkoutSchema = z.object({
  date: dateString,
  title: z.string().min(1).max(200).transform((s) => s.trim()),
  type: workoutType,
  durationMinutes: z.number().int().min(1).max(1440),
  exercises: z.array(exerciseSchema).default([]),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateWorkoutSchema = z.object({
  date: dateString.optional(),
  title: z.string().min(1).max(200).transform((s) => s.trim()).optional(),
  type: workoutType.optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  exercises: z.array(exerciseSchema).optional(),
  notes: z.string().max(2000).optional().nullable(),
}).strict().refine((obj) => Object.keys(obj).length > 0, 'At least one field required');

// ─── Food entry schemas ────────────────────────────────────
export const createFoodEntrySchema = z.object({
  date: dateString,
  name: z.string().min(1).max(500).transform((s) => s.trim()),
  calories: z.number().min(0).max(99999).default(0),
  protein: z.number().min(0).max(99999).default(0),
  carbs: z.number().min(0).max(99999).default(0),
  fats: z.number().min(0).max(99999).default(0),
  portionAmount: z.number().min(0).max(99999).optional().nullable(),
  portionUnit: z.string().max(50).optional().nullable(),
  servingType: z.string().max(50).optional().nullable(),
  startTime: timeString,
  endTime: timeString,
});

export const updateFoodEntrySchema = z.object({
  date: dateString.optional(),
  name: z.string().min(1).max(500).transform((s) => s.trim()).optional(),
  calories: z.number().min(0).max(99999).optional(),
  protein: z.number().min(0).max(99999).optional(),
  carbs: z.number().min(0).max(99999).optional(),
  fats: z.number().min(0).max(99999).optional(),
  portionAmount: z.number().min(0).max(99999).optional().nullable(),
  portionUnit: z.string().max(50).optional().nullable(),
  servingType: z.string().max(50).optional().nullable(),
  startTime: timeString,
  endTime: timeString,
}).strict().refine((obj) => Object.keys(obj).length > 0, 'At least one field required');

// ─── Daily check-in schemas ────────────────────────────────
export const createCheckInSchema = z.object({
  date: dateString,
  sleepHours: z.number().min(0).max(24).optional().nullable(),
});

export const updateCheckInSchema = z.object({
  date: dateString.optional(),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
}).strict().refine((obj) => Object.keys(obj).length > 0, 'At least one field required');

// ─── Goal schemas ──────────────────────────────────────────
export const createGoalSchema = z.object({
  type: goalType,
  target: z.number().min(0).max(999999),
  period: goalPeriod,
});

export const updateGoalSchema = z.object({
  type: goalType.optional(),
  target: z.number().min(0).max(999999).optional(),
  period: goalPeriod.optional(),
}).strict().refine((obj) => Object.keys(obj).length > 0, 'At least one field required');

// ─── Health sync schemas ──────────────────────────────────
const healthPlatform = z.enum(['apple_health', 'health_connect']);

const syncWorkoutItemSchema = z.object({
  externalId: z.string().min(1).max(500),
  date: dateString,
  title: z.string().min(1).max(200).default('Workout'),
  type: z.string().min(1).max(100),
  durationMinutes: z.number().int().min(0).max(1440),
  caloriesBurned: z.number().min(0).optional(),
  heartRateAvg: z.number().min(0).optional(),
  exercises: z.array(exerciseSchema).optional(),
});

const syncSleepItemSchema = z.object({
  externalId: z.string().min(1).max(500),
  date: dateString,
  sleepHours: z.number().min(0).max(24),
  stages: z.object({
    deep: z.number().min(0),
    light: z.number().min(0),
    rem: z.number().min(0),
    awake: z.number().min(0),
  }).optional(),
});

const syncNutritionItemSchema = z.object({
  externalId: z.string().min(1).max(500),
  date: dateString,
  name: z.string().min(1).max(500),
  calories: z.number().min(0).max(99999),
  protein: z.number().min(0).max(99999).optional(),
  carbs: z.number().min(0).max(99999).optional(),
  fats: z.number().min(0).max(99999).optional(),
  mealType: z.string().max(50).optional(),
});

const syncMetricsItemSchema = z.object({
  date: dateString,
  steps: z.number().int().min(0).optional(),
  activeCalories: z.number().min(0).optional(),
  heartRateAvg: z.number().min(0).optional(),
  heartRateResting: z.number().min(0).optional(),
});

export const healthSyncSchema = z.object({
  platform: healthPlatform,
  workouts: z.array(syncWorkoutItemSchema).max(100).optional(),
  sleep: z.array(syncSleepItemSchema).max(100).optional(),
  nutrition: z.array(syncNutritionItemSchema).max(500).optional(),
  metrics: z.array(syncMetricsItemSchema).max(100).optional(),
  syncedAt: z.string().datetime(),
});

export const healthSyncStateUpdateSchema = z.object({
  platform: healthPlatform,
  dataType: z.string().min(1).max(50),
  enabled: z.boolean(),
});

export const healthMetricsQuerySchema = z.object({
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  metricType: z.enum(['steps', 'heart_rate_avg', 'heart_rate_resting', 'active_calories', 'total_calories_burned']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Type exports for inference ─────────────────────────────
export type CreateWorkoutBody = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutBody = z.infer<typeof updateWorkoutSchema>;
export type CreateFoodEntryBody = z.infer<typeof createFoodEntrySchema>;
export type UpdateFoodEntryBody = z.infer<typeof updateFoodEntrySchema>;
export type CreateCheckInBody = z.infer<typeof createCheckInSchema>;
export type UpdateCheckInBody = z.infer<typeof updateCheckInSchema>;
export type CreateGoalBody = z.infer<typeof createGoalSchema>;
export type UpdateGoalBody = z.infer<typeof updateGoalSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type HealthSyncBody = z.infer<typeof healthSyncSchema>;
export type HealthSyncStateUpdateBody = z.infer<typeof healthSyncStateUpdateSchema>;
export type HealthMetricsQuery = z.infer<typeof healthMetricsQuerySchema>;
