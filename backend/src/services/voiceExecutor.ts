/**
 * Voice action executor — runs parsed voice actions against backend services.
 * Used when VOICE_EXECUTE_ON_SERVER is true (default). Server executes, returns results.
 */
import * as transactionService from './transaction.js';
import * as scheduleService from './schedule.js';
import * as workoutService from './workout.js';
import * as foodEntryService from './foodEntry.js';
import * as dailyCheckInService from './dailyCheckIn.js';
import * as goalService from './goal.js';
import { isDbConfigured } from '../db/index.js';

export interface ExecuteResult {
  intent: string;
  success: boolean;
  message?: string;
}

interface VoiceAction {
  intent: string;
  [key: string]: unknown;
}

function parseDate(v: unknown): string {
  if (v == null || v === '') return new Date().toISOString().slice(0, 10);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

async function resolveTransaction(userId: string, action: VoiceAction) {
  if (action.transactionId) {
    const { items } = await transactionService.list(userId, { limit: 1, offset: 0 });
    return items.find((t: { id: string }) => t.id === action.transactionId) ?? null;
  }
  if (action.description) {
    const { items } = await transactionService.list(userId, { limit: 100 });
    const lower = String(action.description).toLowerCase();
    return items.find((t: { description?: string }) => t.description?.toLowerCase().includes(lower)) ?? null;
  }
  return null;
}

async function resolveScheduleItem(userId: string, action: VoiceAction) {
  const items = await scheduleService.list(userId);
  if (action.itemId) {
    return items.find((s: { id: string }) => s.id === action.itemId) ?? null;
  }
  if (action.itemTitle) {
    const lower = String(action.itemTitle).toLowerCase();
    return items.find((s: { title?: string }) => s.title?.toLowerCase().includes(lower)) ?? null;
  }
  return null;
}

async function resolveWorkout(userId: string, action: VoiceAction) {
  const workouts = await workoutService.list(userId);
  if (action.workoutId) {
    return workouts.find((w: { id: string }) => w.id === action.workoutId) ?? null;
  }
  if (action.workoutTitle) {
    const lower = String(action.workoutTitle).toLowerCase();
    return workouts.find((w: { title?: string }) => w.title?.toLowerCase().includes(lower)) ?? null;
  }
  return null;
}

async function resolveFoodEntry(userId: string, action: VoiceAction) {
  const entries = await foodEntryService.list(userId);
  if (action.entryId) {
    return entries.find((e: { id: string }) => e.id === action.entryId) ?? null;
  }
  if (action.foodName) {
    const lower = String(action.foodName).toLowerCase();
    return entries.find((e: { name?: string }) => e.name?.toLowerCase().includes(lower)) ?? null;
  }
  return null;
}

async function resolveCheckIn(userId: string, date: string) {
  const list = await dailyCheckInService.list(userId);
  const dateStr = parseDate(date);
  return list.find((c: { date: string }) => String(c.date).startsWith(dateStr)) ?? null;
}

async function resolveGoal(userId: string, action: VoiceAction) {
  const goals = await goalService.list(userId);
  if (action.goalId) {
    return goals.find((g: { id: string }) => g.id === action.goalId) ?? null;
  }
  if (action.goalType) {
    return goals.find((g: { type: string }) => g.type === action.goalType) ?? null;
  }
  return null;
}

/**
 * Execute parsed voice actions. Returns results; does not throw.
 */
export async function executeActions(actions: VoiceAction[], userId: string): Promise<ExecuteResult[]> {
  if (!isDbConfigured()) {
    return actions.map((a) => ({ intent: a.intent, success: false, message: 'Database not configured' }));
  }

  const results: ExecuteResult[] = [];

  for (const action of actions) {
    if (action.intent === 'unknown') {
      results.push({ intent: 'unknown', success: false, message: (action.message as string) ?? 'Could not understand' });
      continue;
    }

    try {
      switch (action.intent) {
        case 'add_transaction':
          await transactionService.create(userId, {
            type: action.type as 'income' | 'expense',
            amount: Number(action.amount) ?? 0,
            currency: (action.currency as string) ?? 'USD',
            category: (action.category as string) ?? 'Other',
            description: action.description as string,
            date: parseDate(action.date),
            isRecurring: !!action.isRecurring,
          });
          results.push({ intent: 'add_transaction', success: true });
          break;

        case 'edit_transaction': {
          const tx = await resolveTransaction(userId, action);
          if (!tx) {
            results.push({ intent: 'edit_transaction', success: false, message: 'Transaction not found' });
            break;
          }
          await transactionService.update(userId, tx.id, {
            type: action.type as string,
            amount: action.amount != null ? Number(action.amount) : undefined,
            category: action.category as string,
            description: action.description as string,
            date: action.date ? parseDate(action.date) : undefined,
          });
          results.push({ intent: 'edit_transaction', success: true });
          break;
        }

        case 'delete_transaction': {
          const tx = await resolveTransaction(userId, action);
          if (!tx) {
            results.push({ intent: 'delete_transaction', success: false, message: 'Transaction not found' });
            break;
          }
          await transactionService.remove(userId, tx.id);
          results.push({ intent: 'delete_transaction', success: true });
          break;
        }

        case 'add_schedule': {
          const items = Array.isArray(action.items) ? action.items : [];
          if (items.length === 0) {
            results.push({ intent: 'add_schedule', success: false, message: 'No schedule items' });
            break;
          }
          const normalized = items.map((it: Record<string, unknown>) => ({
            title: String(it.title ?? ''),
            startTime: (it.startTime as string) ?? '09:00',
            endTime: (it.endTime as string) ?? '10:00',
            category: (it.category as string) ?? 'Other',
            recurrence: it.recurrence as string,
            date: parseDate(it.date),
          }));
          await scheduleService.createBatch(userId, normalized);
          results.push({ intent: 'add_schedule', success: true, message: `Added ${normalized.length} item(s)` });
          break;
        }

        case 'edit_schedule': {
          const item = await resolveScheduleItem(userId, action);
          if (!item) {
            results.push({ intent: 'edit_schedule', success: false, message: 'Schedule item not found' });
            break;
          }
          await scheduleService.update(userId, item.id, {
            startTime: action.startTime as string,
            endTime: action.endTime as string,
            title: action.title as string,
            category: action.category as string,
          });
          results.push({ intent: 'edit_schedule', success: true });
          break;
        }

        case 'delete_schedule': {
          const item = await resolveScheduleItem(userId, action);
          if (!item) {
            results.push({ intent: 'delete_schedule', success: false, message: 'Schedule item not found' });
            break;
          }
          await scheduleService.remove(userId, item.id);
          results.push({ intent: 'delete_schedule', success: true });
          break;
        }

        case 'add_workout':
          await workoutService.create(userId, {
            date: parseDate(action.date),
            title: (action.title as string) ?? 'Workout',
            type: (action.type as string) ?? 'cardio',
            durationMinutes: Number(action.durationMinutes) || 30,
            exercises: Array.isArray(action.exercises) ? action.exercises : [],
            notes: action.notes as string,
          });
          results.push({ intent: 'add_workout', success: true });
          break;

        case 'edit_workout': {
          const w = await resolveWorkout(userId, action);
          if (!w) {
            results.push({ intent: 'edit_workout', success: false, message: 'Workout not found' });
            break;
          }
          await workoutService.update(userId, w.id, {
            title: action.title as string,
            type: action.type as string,
            durationMinutes: action.durationMinutes != null ? Number(action.durationMinutes) : undefined,
            notes: action.notes as string,
            date: action.date ? parseDate(action.date) : undefined,
            exercises: Array.isArray(action.exercises) ? action.exercises : undefined,
          });
          results.push({ intent: 'edit_workout', success: true });
          break;
        }

        case 'delete_workout': {
          const w = await resolveWorkout(userId, action);
          if (!w) {
            results.push({ intent: 'delete_workout', success: false, message: 'Workout not found' });
            break;
          }
          await workoutService.remove(userId, w.id);
          results.push({ intent: 'delete_workout', success: true });
          break;
        }

        case 'add_food':
          await foodEntryService.create(userId, {
            date: parseDate(action.date),
            name: (action.name as string) ?? 'Unknown',
            calories: Number(action.calories) ?? 0,
            protein: Number(action.protein) ?? 0,
            carbs: Number(action.carbs) ?? 0,
            fats: Number(action.fats) ?? 0,
            portionAmount: action.portionAmount != null ? Number(action.portionAmount) : undefined,
            portionUnit: action.portionUnit as string,
            startTime: action.startTime as string,
            endTime: action.endTime as string,
          });
          results.push({ intent: 'add_food', success: true });
          break;

        case 'edit_food_entry': {
          const e = await resolveFoodEntry(userId, action);
          if (!e) {
            results.push({ intent: 'edit_food_entry', success: false, message: 'Food entry not found' });
            break;
          }
          await foodEntryService.update(userId, e.id, {
            name: action.name as string,
            calories: action.calories != null ? Number(action.calories) : undefined,
            protein: action.protein != null ? Number(action.protein) : undefined,
            carbs: action.carbs != null ? Number(action.carbs) : undefined,
            fats: action.fats != null ? Number(action.fats) : undefined,
            date: action.date ? parseDate(action.date) : undefined,
          });
          results.push({ intent: 'edit_food_entry', success: true });
          break;
        }

        case 'delete_food_entry': {
          const e = await resolveFoodEntry(userId, action);
          if (!e) {
            results.push({ intent: 'delete_food_entry', success: false, message: 'Food entry not found' });
            break;
          }
          await foodEntryService.remove(userId, e.id);
          results.push({ intent: 'delete_food_entry', success: true });
          break;
        }

        case 'log_sleep': {
          const dateStr = parseDate(action.date);
          const existing = await resolveCheckIn(userId, dateStr);
          const hours = Number(action.sleepHours) ?? 0;
          if (existing) {
            await dailyCheckInService.update(userId, existing.id, { sleepHours: hours });
          } else {
            await dailyCheckInService.create(userId, { date: dateStr, sleepHours: hours });
          }
          results.push({ intent: 'log_sleep', success: true });
          break;
        }

        case 'edit_check_in': {
          if (!action.date) {
            results.push({ intent: 'edit_check_in', success: false, message: 'Date required' });
            break;
          }
          const existing = await resolveCheckIn(userId, parseDate(action.date));
          if (!existing) {
            results.push({ intent: 'edit_check_in', success: false, message: 'Check-in not found' });
            break;
          }
          await dailyCheckInService.update(userId, existing.id, { sleepHours: Number(action.sleepHours) ?? 0 });
          results.push({ intent: 'edit_check_in', success: true });
          break;
        }

        case 'delete_check_in': {
          if (!action.date) {
            results.push({ intent: 'delete_check_in', success: false, message: 'Date required' });
            break;
          }
          const existing = await resolveCheckIn(userId, parseDate(action.date));
          if (!existing) {
            results.push({ intent: 'delete_check_in', success: false, message: 'Check-in not found' });
            break;
          }
          await dailyCheckInService.remove(userId, existing.id);
          results.push({ intent: 'delete_check_in', success: true });
          break;
        }

        case 'add_goal':
          await goalService.create(userId, {
            type: (action.type as string) ?? 'workouts',
            target: Number(action.target) ?? 0,
            period: (action.period as string) ?? 'weekly',
          });
          results.push({ intent: 'add_goal', success: true });
          break;

        case 'edit_goal': {
          const g = await resolveGoal(userId, action);
          if (!g) {
            results.push({ intent: 'edit_goal', success: false, message: 'Goal not found' });
            break;
          }
          await goalService.update(userId, g.id, {
            target: action.target != null ? Number(action.target) : undefined,
            period: action.period as string,
          });
          results.push({ intent: 'edit_goal', success: true });
          break;
        }

        case 'delete_goal': {
          const g = await resolveGoal(userId, action);
          if (!g) {
            results.push({ intent: 'delete_goal', success: false, message: 'Goal not found' });
            break;
          }
          await goalService.remove(userId, g.id);
          results.push({ intent: 'delete_goal', success: true });
          break;
        }

        default:
          results.push({ intent: action.intent, success: false, message: 'Unsupported action' });
      }
    } catch (err) {
      results.push({
        intent: action.intent,
        success: false,
        message: (err as Error)?.message ?? 'An error occurred',
      });
    }
  }

  return results;
}
