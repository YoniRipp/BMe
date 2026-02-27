import { z } from 'zod';

const voiceScheduleItemSchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  startTime: z.string().default('09:00'),
  endTime: z.string().default('10:00'),
  category: z.string().default('Other'),
  recurrence: z.string().optional(),
});

const addScheduleSchema = z.object({
  intent: z.literal('add_schedule'),
  items: z.array(voiceScheduleItemSchema).default([]),
});
const editScheduleSchema = z.object({
  intent: z.literal('edit_schedule'),
  itemTitle: z.string().optional(),
  itemId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  title: z.string().optional(),
  category: z.string().optional(),
});
const deleteScheduleSchema = z.object({
  intent: z.literal('delete_schedule'),
  itemTitle: z.string().optional(),
  itemId: z.string().optional(),
});

const addTransactionSchema = z.object({
  intent: z.literal('add_transaction'),
  type: z.enum(['income', 'expense']).default('expense'),
  amount: z.number().min(0).default(0),
  category: z.string().default('Other'),
  description: z.string().optional(),
  date: z.string().optional(),
  isRecurring: z.boolean().default(false),
});
const editTransactionSchema = z.object({
  intent: z.literal('edit_transaction'),
  description: z.string().optional(),
  transactionId: z.string().optional(),
  date: z.string().optional(),
  type: z.string().optional(),
  amount: z.number().optional(),
  category: z.string().optional(),
});
const deleteTransactionSchema = z.object({
  intent: z.literal('delete_transaction'),
  description: z.string().optional(),
  transactionId: z.string().optional(),
  date: z.string().optional(),
});

const voiceExerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

const addWorkoutSchema = z.object({
  intent: z.literal('add_workout'),
  date: z.string().optional(),
  title: z.string().default('Workout'),
  type: z.string().default('cardio'),
  durationMinutes: z.number().default(30),
  notes: z.string().optional(),
  exercises: z.array(voiceExerciseSchema).optional().default([]),
});
const editWorkoutSchema = z.object({
  intent: z.literal('edit_workout'),
  workoutTitle: z.string().optional(),
  workoutId: z.string().optional(),
  date: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
  durationMinutes: z.number().optional(),
  notes: z.union([z.string(), z.undefined()]).optional(),
  exercises: z.array(voiceExerciseSchema).optional(),
});
const deleteWorkoutSchema = z.object({
  intent: z.literal('delete_workout'),
  workoutTitle: z.string().optional(),
  workoutId: z.string().optional(),
  date: z.string().optional(),
});

const addFoodSchema = z.object({
  intent: z.literal('add_food'),
  name: z.string().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fats: z.number().optional(),
  food: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  portionAmount: z.number().optional(),
  portionUnit: z.string().optional(),
});
const editFoodEntrySchema = z.object({
  intent: z.literal('edit_food_entry'),
  foodName: z.string().optional(),
  entryId: z.string().optional(),
  date: z.string().optional(),
  name: z.string().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fats: z.number().optional(),
});
const deleteFoodEntrySchema = z.object({
  intent: z.literal('delete_food_entry'),
  foodName: z.string().optional(),
  entryId: z.string().optional(),
  date: z.string().optional(),
});

const logSleepSchema = z.object({
  intent: z.literal('log_sleep'),
  sleepHours: z.number().min(0).default(0),
  date: z.string().optional(),
});
const editCheckInSchema = z.object({
  intent: z.literal('edit_check_in'),
  date: z.string().optional(),
  sleepHours: z.number().optional(),
});
const deleteCheckInSchema = z.object({
  intent: z.literal('delete_check_in'),
  date: z.string().optional(),
});

const addGoalSchema = z.object({
  intent: z.literal('add_goal'),
  type: z.string().default('workouts'),
  target: z.number().default(0),
  period: z.string().default('weekly'),
});
const editGoalSchema = z.object({
  intent: z.literal('edit_goal'),
  goalType: z.string().optional(),
  goalId: z.string().optional(),
  target: z.number().optional(),
  period: z.string().optional(),
});
const deleteGoalSchema = z.object({
  intent: z.literal('delete_goal'),
  goalType: z.string().optional(),
  goalId: z.string().optional(),
});

const unknownSchema = z.object({ intent: z.literal('unknown') });

export const voiceActionSchema = z.discriminatedUnion('intent', [
  addScheduleSchema,
  editScheduleSchema,
  deleteScheduleSchema,
  addTransactionSchema,
  editTransactionSchema,
  deleteTransactionSchema,
  addWorkoutSchema,
  editWorkoutSchema,
  deleteWorkoutSchema,
  addFoodSchema,
  editFoodEntrySchema,
  deleteFoodEntrySchema,
  logSleepSchema,
  editCheckInSchema,
  deleteCheckInSchema,
  addGoalSchema,
  editGoalSchema,
  deleteGoalSchema,
  unknownSchema,
]);

export type VoiceAction = z.infer<typeof voiceActionSchema>;
export type VoiceScheduleItem = z.infer<typeof voiceScheduleItemSchema>;

export const voiceUnderstandResultSchema = z.object({
  actions: z.array(voiceActionSchema),
});

export function parseVoiceAction(raw: unknown): VoiceAction {
  const result = voiceActionSchema.safeParse(raw);
  if (result.success) return result.data;
  if (raw != null && typeof raw === 'object' && typeof (raw as { intent?: string }).intent === 'string') {
    return { intent: 'unknown' };
  }
  return { intent: 'unknown' };
}
