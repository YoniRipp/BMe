/**
 * Voice action builders -- transform Gemini function call args into typed action objects.
 */
import { WORKOUT_TYPES, GOAL_TYPES, GOAL_PERIODS } from '../../config/constants.js';
import { normTime } from '../../utils/validation.js';
import { lookupNutrition } from './foodLookupPipeline.js';

interface BuildContext {
  todayStr: string;
  timezone?: string;
}

// --- Helpers -----------------------------------------------

const trim = (v: unknown) => (v != null ? String(v).trim() : undefined);
const trimOrUndefined = (v: unknown) => (v != null && String(v).trim() !== '' ? String(v).trim() : undefined);
const num = (v: unknown) => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
const passThrough = (v: unknown) => v;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(d: unknown, todayStr: string): string {
  return (typeof d === 'string' && dateRegex.test(d)) ? d : todayStr;
}

function mapArgs(args: Record<string, unknown>, spec: Record<string, (v: unknown) => unknown>): Record<string, unknown> {
  const entries: [string, unknown][] = [];
  for (const [key, transform] of Object.entries(spec)) {
    const v = args[key];
    if (v === undefined || v === null) continue;
    const val = transform(v);
    if (val === undefined) continue;
    entries.push([key, val]);
  }
  return Object.fromEntries(entries);
}

function normExercises(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e: Record<string, unknown>) => e && typeof e.name === 'string' && (e.name as string).trim())
    .map((e: Record<string, unknown>) => ({
      name: String(e.name).trim(),
      sets: Math.max(0, Number(e.sets) || 0),
      reps: Math.max(0, Number(e.reps) || 0),
      weight: Number(e.weight) > 0 ? Number(e.weight) : undefined,
      notes: e.notes ? String(e.notes).trim() : undefined,
    }));
}

// --- Edit/Delete specs -------------------------------------

const EDIT_WORKOUT_SPEC = { workoutTitle: trimOrUndefined, workoutId: trimOrUndefined, date: passThrough, title: trimOrUndefined, type: passThrough, durationMinutes: num, notes: passThrough, exercises: normExercises };
const DELETE_WORKOUT_SPEC = { workoutTitle: trimOrUndefined, workoutId: trimOrUndefined, date: passThrough };
const EDIT_FOOD_ENTRY_SPEC = { foodName: trimOrUndefined, entryId: trimOrUndefined, date: passThrough, name: trimOrUndefined, calories: num, protein: num, carbs: num, fats: num };
const DELETE_FOOD_ENTRY_SPEC = { foodName: trimOrUndefined, entryId: trimOrUndefined, date: passThrough };
const EDIT_CHECK_IN_SPEC = { date: passThrough, sleepHours: num };
const DELETE_CHECK_IN_SPEC = { date: passThrough };
const EDIT_GOAL_SPEC = { goalType: passThrough, goalId: passThrough, target: num, period: passThrough };
const DELETE_GOAL_SPEC = { goalType: passThrough, goalId: passThrough };

// --- Builders ----------------------------------------------

export function buildAddWorkout(args: Record<string, unknown>, ctx: BuildContext) {
  return {
    date: parseDate(args.date, ctx.todayStr),
    title: args.title ? trim(args.title) : 'Workout',
    type: (typeof args.type === 'string' && WORKOUT_TYPES.includes(args.type)) ? args.type : 'cardio',
    durationMinutes: Number.isFinite(Number(args.durationMinutes)) && Number(args.durationMinutes) > 0 ? Number(args.durationMinutes) : 30,
    exercises: normExercises(args.exercises),
    notes: args.notes ? trim(args.notes) : undefined,
  };
}

export async function buildAddFood(args: Record<string, unknown>, ctx: BuildContext) {
  const food = args.food ? String(args.food).trim() : '';
  const amount = Number(args.amount);
  const numAmount = Number.isFinite(amount) && amount > 0 ? amount : 100;
  const unit = args.unit ? String(args.unit).trim().toLowerCase() : 'g';

  const action: Record<string, unknown> = {
    food,
    amount: numAmount,
    unit,
    date: parseDate(args.date, ctx.todayStr),
    startTime: normTime(args.startTime as string | undefined | null) ?? undefined,
    endTime: normTime(args.endTime as string | undefined | null) ?? undefined,
    portionAmount: numAmount,
    portionUnit: unit,
  };

  const nutrition = await lookupNutrition(food || 'unknown', numAmount, unit);
  action.name = nutrition.name;
  action.calories = nutrition.calories;
  action.protein = nutrition.protein;
  action.carbs = nutrition.carbs;
  action.fats = nutrition.fats;

  return action;
}

export function buildLogSleep(args: Record<string, unknown>, ctx: BuildContext) {
  const sh = Number(args.sleepHours);
  return {
    sleepHours: Number.isFinite(sh) && sh >= 0 ? sh : 0,
    date: parseDate(args.date, ctx.todayStr),
  };
}

export function buildAddGoal(args: Record<string, unknown>) {
  return {
    type: (typeof args.type === 'string' && GOAL_TYPES.includes(args.type)) ? args.type : 'workouts',
    target: Number.isFinite(Number(args.target)) ? Number(args.target) : 0,
    period: (typeof args.period === 'string' && GOAL_PERIODS.includes(args.period)) ? args.period : 'weekly',
  };
}

export const buildEditWorkout = (args: Record<string, unknown>) => mapArgs(args, EDIT_WORKOUT_SPEC);
export const buildDeleteWorkout = (args: Record<string, unknown>) => mapArgs(args, DELETE_WORKOUT_SPEC);
export const buildEditFoodEntry = (args: Record<string, unknown>) => mapArgs(args, EDIT_FOOD_ENTRY_SPEC);
export const buildDeleteFoodEntry = (args: Record<string, unknown>) => mapArgs(args, DELETE_FOOD_ENTRY_SPEC);
export const buildEditCheckIn = (args: Record<string, unknown>) => mapArgs(args, EDIT_CHECK_IN_SPEC);
export const buildDeleteCheckIn = (args: Record<string, unknown>) => mapArgs(args, DELETE_CHECK_IN_SPEC);
export const buildEditGoal = (args: Record<string, unknown>) => mapArgs(args, EDIT_GOAL_SPEC);
export const buildDeleteGoal = (args: Record<string, unknown>) => mapArgs(args, DELETE_GOAL_SPEC);

// --- Handler registry --------------------------------------

export type HandlerResult = { merge?: Record<string, unknown>; items?: unknown[] };

export const HANDLERS: Record<string, (args: Record<string, unknown>, ctx: BuildContext) => Promise<HandlerResult>> = {
  add_workout: (args, ctx) => Promise.resolve({ merge: buildAddWorkout(args, ctx) }),
  edit_workout: (args) => Promise.resolve({ merge: buildEditWorkout(args) }),
  delete_workout: (args) => Promise.resolve({ merge: buildDeleteWorkout(args) }),
  add_food: (args, ctx) => buildAddFood(args, ctx).then((merge) => ({ merge })),
  edit_food_entry: (args) => Promise.resolve({ merge: buildEditFoodEntry(args) }),
  delete_food_entry: (args) => Promise.resolve({ merge: buildDeleteFoodEntry(args) }),
  log_sleep: (args, ctx) => Promise.resolve({ merge: buildLogSleep(args, ctx) }),
  edit_check_in: (args) => Promise.resolve({ merge: buildEditCheckIn(args) }),
  delete_check_in: (args) => Promise.resolve({ merge: buildDeleteCheckIn(args) }),
  add_goal: (args) => Promise.resolve({ merge: buildAddGoal(args) }),
  edit_goal: (args) => Promise.resolve({ merge: buildEditGoal(args) }),
  delete_goal: (args) => Promise.resolve({ merge: buildDeleteGoal(args) }),
};
