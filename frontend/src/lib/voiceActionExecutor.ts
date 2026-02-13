/**
 * Shared voice action executor. Used by VoiceAgentPanel and VoiceAgentButton.
 */
import type { VoiceAction } from '@/lib/voiceApi';
import { SCHEDULE_CATEGORIES, type ScheduleItem } from '@/types/schedule';
import { TRANSACTION_CATEGORIES, type Transaction } from '@/types/transaction';
import { CATEGORY_EMOJIS } from '@/types/schedule';
import type { Workout, WorkoutType } from '@/types/workout';
import type { Goal } from '@/types/goals';
import type { DailyCheckIn, FoodEntry } from '@/types/energy';

const VALID_SCHEDULE_CATEGORIES = new Set(SCHEDULE_CATEGORIES);
const VALID_INCOME = new Set(TRANSACTION_CATEGORIES.income);
const VALID_EXPENSE = new Set(TRANSACTION_CATEGORIES.expense);
const VALID_RECURRENCE = ['daily', 'weekdays', 'weekends'] as const;
const VALID_WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports'] as const;

function parseDateOrToday(dateStr?: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface VoiceExecutorContext {
  scheduleItems: ScheduleItem[];
  addScheduleItems: (items: Omit<ScheduleItem, 'id'>[]) => Promise<void>;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  getScheduleItemById: (id: string) => ScheduleItem | undefined;

  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  foodEntries: FoodEntry[];
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => Promise<void>;
  updateFoodEntry: (id: string, updates: Partial<FoodEntry>) => Promise<void>;
  deleteFoodEntry: (id: string) => Promise<void>;

  addCheckIn: (checkIn: Omit<DailyCheckIn, 'id'>) => Promise<void>;
  updateCheckIn: (id: string, updates: Partial<DailyCheckIn>) => Promise<void>;
  deleteCheckIn: (id: string) => Promise<void>;
  getCheckInByDate: (date: Date) => DailyCheckIn | undefined;

  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<Workout>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export type VoiceExecuteResult = { success: boolean; message?: string };

type Handler = (action: VoiceAction, ctx: VoiceExecutorContext) => Promise<VoiceExecuteResult>;

const handleAddSchedule: Handler = async (action, ctx) => {
  if (action.intent !== 'add_schedule' || !action.items?.length) return { success: false, message: 'No schedule items' };
  let order = ctx.scheduleItems.length;
  const itemsToAdd = action.items.map((item) => {
    const category = VALID_SCHEDULE_CATEGORIES.has(item.category as (typeof SCHEDULE_CATEGORIES)[number]) ? item.category : 'Other';
    const recurrence = item.recurrence && VALID_RECURRENCE.includes(item.recurrence as (typeof VALID_RECURRENCE)[number]) ? (item.recurrence as 'daily' | 'weekdays' | 'weekends') : undefined;
    return {
      title: item.title,
      startTime: item.startTime ?? '09:00',
      endTime: item.endTime ?? '10:00',
      category,
      emoji: CATEGORY_EMOJIS[category],
      order: order++,
      isActive: true,
      recurrence,
    };
  });
  await ctx.addScheduleItems(itemsToAdd);
  return { success: true, message: `Added ${itemsToAdd.length} to schedule` };
};

const handleEditSchedule: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_schedule') return { success: false };
  let targetId = action.itemId ? ctx.getScheduleItemById(action.itemId)?.id : undefined;
  if (!targetId && action.itemTitle) targetId = ctx.scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()))?.id;
  if (!targetId) return { success: false, message: 'Schedule item not found' };
  const updates: Record<string, unknown> = {};
  if (action.startTime) updates.startTime = action.startTime;
  if (action.endTime) updates.endTime = action.endTime;
  if (action.title) updates.title = action.title;
  if (action.category) updates.category = action.category;
  if (Object.keys(updates).length > 0) await ctx.updateScheduleItem(targetId, updates);
  return { success: true };
};

const handleDeleteSchedule: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_schedule') return { success: false };
  let targetId = action.itemId ? ctx.getScheduleItemById(action.itemId)?.id : undefined;
  if (!targetId && action.itemTitle) targetId = ctx.scheduleItems.find((s) => s.title.toLowerCase().includes(action.itemTitle!.toLowerCase()))?.id;
  if (!targetId) return { success: false, message: 'Schedule item not found' };
  await ctx.deleteScheduleItem(targetId);
  return { success: true };
};

const handleAddTransaction: Handler = async (action, ctx) => {
  if (action.intent !== 'add_transaction') return { success: false };
  const category: string = action.type === 'income' ? (VALID_INCOME.has(action.category as (typeof TRANSACTION_CATEGORIES.income)[number]) ? action.category : 'Other') : (VALID_EXPENSE.has(action.category as (typeof TRANSACTION_CATEGORIES.expense)[number]) ? action.category : 'Other');
  await ctx.addTransaction({ type: action.type, amount: action.amount >= 0 ? action.amount : 0, category, description: action.description, date: parseDateOrToday(action.date), isRecurring: action.isRecurring ?? false });
  return { success: true };
};

const handleEditTransaction: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_transaction') return { success: false };
  const target = action.transactionId ? ctx.transactions.find((t) => t.id === action.transactionId) : ctx.transactions.find((t) => t.description?.toLowerCase().includes((action.description ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Transaction not found' };
  const updates: Record<string, unknown> = {};
  if (action.type) updates.type = action.type;
  if (action.amount != null) updates.amount = action.amount;
  if (action.category) updates.category = action.category;
  if (action.description !== undefined) updates.description = action.description;
  if (action.date) updates.date = parseDateOrToday(action.date);
  if (Object.keys(updates).length > 0) await ctx.updateTransaction(target.id, updates);
  return { success: true };
};

const handleDeleteTransaction: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_transaction') return { success: false };
  const target = action.transactionId ? ctx.transactions.find((t) => t.id === action.transactionId) : ctx.transactions.find((t) => t.description?.toLowerCase().includes((action.description ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Transaction not found' };
  await ctx.deleteTransaction(target.id);
  return { success: true };
};

const handleAddWorkout: Handler = async (action, ctx) => {
  if (action.intent !== 'add_workout') return { success: false };
  const rawExercises = Array.isArray(action.exercises) ? action.exercises : [];
  const exercises = rawExercises
    .filter((e: { name?: string }) => e?.name && String(e.name).trim())
    .map((e: { name?: string; sets?: number; reps?: number; weight?: number; notes?: string }) => ({
      name: String(e.name).trim(),
      sets: Math.max(0, Number(e.sets) ?? 0),
      reps: Math.max(0, Number(e.reps) ?? 0),
      weight: Number(e.weight) > 0 ? Number(e.weight) : undefined,
      notes: e.notes ? String(e.notes).trim() : undefined,
    }));
  await ctx.addWorkout({
    date: parseDateOrToday(action.date),
    title: action.title ?? 'Workout',
    type: (VALID_WORKOUT_TYPES.includes(action.type as (typeof VALID_WORKOUT_TYPES)[number]) ? action.type : 'cardio') as WorkoutType,
    durationMinutes: action.durationMinutes ?? 30,
    exercises,
    notes: action.notes,
  });
  return { success: true };
};

const handleEditWorkout: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_workout') return { success: false };
  const target = action.workoutId ? ctx.workouts.find((w) => w.id === action.workoutId) : ctx.workouts.find((w) => w.title.toLowerCase().includes((action.workoutTitle ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Workout not found' };
  const updates: Record<string, unknown> = {};
  if (action.title) updates.title = action.title;
  if (action.type) updates.type = action.type;
  if (action.durationMinutes != null) updates.durationMinutes = action.durationMinutes;
  if (action.notes !== undefined) updates.notes = action.notes;
  if (action.date) updates.date = parseDateOrToday(action.date);
  if (Array.isArray(action.exercises)) updates.exercises = action.exercises;
  if (Object.keys(updates).length > 0) await ctx.updateWorkout(target.id, updates);
  return { success: true };
};

const handleDeleteWorkout: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_workout') return { success: false };
  const target = action.workoutId ? ctx.workouts.find((w) => w.id === action.workoutId) : ctx.workouts.find((w) => w.title.toLowerCase().includes((action.workoutTitle ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Workout not found' };
  await ctx.deleteWorkout(target.id);
  return { success: true };
};

const handleAddFood: Handler = async (action, ctx) => {
  if (action.intent !== 'add_food') return { success: false };
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceActionExecutor.ts:handleAddFood:entry', message: 'add_food received', data: { name: action.name, calories: action.calories, willBail: !action.name && action.calories == null }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => {});
  // #endregion
  if (!action.name && action.calories == null) return { success: false, message: 'Food not found' };
  try {
    await ctx.addFoodEntry({ date: parseDateOrToday(action.date), name: action.name ?? 'Unknown', calories: action.calories ?? 0, protein: action.protein ?? 0, carbs: action.carbs ?? 0, fats: action.fats ?? 0 });
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceActionExecutor.ts:handleAddFood:afterAdd', message: 'addFoodEntry resolved', data: {}, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => {});
    // #endregion
    return { success: true };
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voiceActionExecutor.ts:handleAddFood:catch', message: 'addFoodEntry failed', data: { error: e instanceof Error ? e.message : String(e) }, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => {});
    // #endregion
    throw e;
  }
};

const handleEditFoodEntry: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_food_entry') return { success: false };
  const target = action.entryId ? ctx.foodEntries.find((e) => e.id === action.entryId) : ctx.foodEntries.find((e) => e.name.toLowerCase().includes((action.foodName ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Food entry not found' };
  const updates: Record<string, unknown> = {};
  if (action.name) updates.name = action.name;
  if (action.calories != null) updates.calories = action.calories;
  if (action.protein != null) updates.protein = action.protein;
  if (action.carbs != null) updates.carbs = action.carbs;
  if (action.fats != null) updates.fats = action.fats;
  if (action.date) updates.date = parseDateOrToday(action.date);
  if (Object.keys(updates).length > 0) await ctx.updateFoodEntry(target.id, updates);
  return { success: true };
};

const handleDeleteFoodEntry: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_food_entry') return { success: false };
  const target = action.entryId ? ctx.foodEntries.find((e) => e.id === action.entryId) : ctx.foodEntries.find((e) => e.name.toLowerCase().includes((action.foodName ?? '').toLowerCase()));
  if (!target) return { success: false, message: 'Food entry not found' };
  await ctx.deleteFoodEntry(target.id);
  return { success: true };
};

const handleLogSleep: Handler = async (action, ctx) => {
  if (action.intent !== 'log_sleep') return { success: false };
  const date = parseDateOrToday(action.date);
  const existing = ctx.getCheckInByDate(date);
  if (existing) await ctx.updateCheckIn(existing.id, { sleepHours: action.sleepHours });
  else await ctx.addCheckIn({ date, sleepHours: action.sleepHours });
  return { success: true };
};

const handleEditCheckIn: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_check_in') return { success: false };
  if (!action.date) return { success: false, message: 'Date required' };
  const existing = ctx.getCheckInByDate(parseDateOrToday(action.date));
  if (!existing) return { success: false, message: 'Check-in not found' };
  await ctx.updateCheckIn(existing.id, { sleepHours: action.sleepHours });
  return { success: true };
};

const handleDeleteCheckIn: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_check_in') return { success: false };
  if (!action.date) return { success: false, message: 'Date required' };
  const existing = ctx.getCheckInByDate(parseDateOrToday(action.date));
  if (!existing) return { success: false, message: 'Check-in not found' };
  await ctx.deleteCheckIn(existing.id);
  return { success: true };
};

const handleAddGoal: Handler = async (action, ctx) => {
  if (action.intent !== 'add_goal') return { success: false };
  await ctx.addGoal({ type: action.type as 'calories' | 'workouts' | 'savings', target: action.target, period: action.period as 'daily' | 'weekly' | 'monthly' | 'yearly' });
  return { success: true };
};

const handleEditGoal: Handler = async (action, ctx) => {
  if (action.intent !== 'edit_goal') return { success: false };
  const target = action.goalId ? ctx.goals.find((g) => g.id === action.goalId) : ctx.goals.find((g) => g.type === action.goalType);
  if (!target) return { success: false, message: 'Goal not found' };
  const updates: Record<string, unknown> = {};
  if (action.target != null) updates.target = action.target;
  if (action.period) updates.period = action.period;
  if (Object.keys(updates).length > 0) await ctx.updateGoal(target.id, updates);
  return { success: true };
};

const handleDeleteGoal: Handler = async (action, ctx) => {
  if (action.intent !== 'delete_goal') return { success: false };
  const target = action.goalId ? ctx.goals.find((g) => g.id === action.goalId) : ctx.goals.find((g) => g.type === action.goalType);
  if (!target) return { success: false, message: 'Goal not found' };
  await ctx.deleteGoal(target.id);
  return { success: true };
};

const HANDLERS: Partial<Record<VoiceAction['intent'], Handler>> = {
  add_schedule: handleAddSchedule,
  edit_schedule: handleEditSchedule,
  delete_schedule: handleDeleteSchedule,
  add_transaction: handleAddTransaction,
  edit_transaction: handleEditTransaction,
  delete_transaction: handleDeleteTransaction,
  add_workout: handleAddWorkout,
  edit_workout: handleEditWorkout,
  delete_workout: handleDeleteWorkout,
  add_food: handleAddFood,
  edit_food_entry: handleEditFoodEntry,
  delete_food_entry: handleDeleteFoodEntry,
  log_sleep: handleLogSleep,
  edit_check_in: handleEditCheckIn,
  delete_check_in: handleDeleteCheckIn,
  add_goal: handleAddGoal,
  edit_goal: handleEditGoal,
  delete_goal: handleDeleteGoal,
};

/**
 * Execute a single voice action with the given context. Awaits context methods and returns success only after they resolve.
 */
export async function executeVoiceAction(action: VoiceAction, context: VoiceExecutorContext): Promise<VoiceExecuteResult> {
  try {
    if (action.intent === 'unknown') return { success: false, message: 'Could not understand' };
    const handler = HANDLERS[action.intent];
    if (!handler) return { success: false, message: 'Could not understand' };
    return await handler(action, context);
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}
