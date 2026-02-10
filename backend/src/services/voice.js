/**
 * Voice service — Gemini parsing and action mapping.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { isDbConfigured, getPool } from '../db/index.js';
import { SCHEDULE_CATEGORIES, VALID_RECURRENCE, TRANSACTION_CATEGORIES, WORKOUT_TYPES, GOAL_TYPES, GOAL_PERIODS } from '../config/constants.js';
import { normTime, normCat } from '../utils/validation.js';
import { VOICE_TOOLS } from '../../voice/tools.js';
import { getNutritionForFoodName } from '../models/foodSearch.js';

const VOICE_PROMPT = `You are a voice assistant for a life management app. The user speaks in Hebrew or English.
Parse their message and call the appropriate function(s) for each action they want to take.
Examples: "work 8-18, eat 18-22" → add_schedule twice. "bought coke for 10, slept 8 hours" → add_transaction + log_sleep.
Call all relevant functions; the user may combine multiple actions in one message.`;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(d, todayStr) {
  return d && dateRegex.test(d) ? d : todayStr;
}

/** Build object from args using a spec: { [outputKey]: (value) => transformedValue }. Skips when value is undefined/null or transform returns undefined. */
function mapArgs(args, spec) {
  return Object.fromEntries(
    Object.entries(spec)
      .map(([key, transform]) => {
        const v = args[key];
        if (v === undefined || v === null) return null;
        const val = transform(v);
        return val === undefined ? null : [key, val];
      })
      .filter(Boolean)
  );
}

const trim = (v) => (v != null ? String(v).trim() : undefined);
const trimOrUndefined = (v) => (v != null && String(v).trim() !== '' ? String(v).trim() : undefined);
const num = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
const passThrough = (v) => v;

const EDIT_SCHEDULE_SPEC = {
  itemTitle: trimOrUndefined,
  itemId: trimOrUndefined,
  startTime: normTime,
  endTime: normTime,
  title: trimOrUndefined,
  category: (v) => normCat(v, SCHEDULE_CATEGORIES),
};
const DELETE_SCHEDULE_SPEC = {
  itemTitle: trimOrUndefined,
  itemId: trimOrUndefined,
};
const EDIT_TRANSACTION_SPEC = {
  description: trimOrUndefined,
  transactionId: trimOrUndefined,
  date: passThrough,
  type: passThrough,
  amount: num,
  category: passThrough,
};
const DELETE_TRANSACTION_SPEC = {
  description: trimOrUndefined,
  transactionId: trimOrUndefined,
  date: passThrough,
};
const EDIT_WORKOUT_SPEC = {
  workoutTitle: trimOrUndefined,
  workoutId: trimOrUndefined,
  date: passThrough,
  title: trimOrUndefined,
  type: passThrough,
  durationMinutes: num,
  notes: passThrough,
};
const DELETE_WORKOUT_SPEC = {
  workoutTitle: trimOrUndefined,
  workoutId: trimOrUndefined,
  date: passThrough,
};
const EDIT_FOOD_ENTRY_SPEC = {
  foodName: trimOrUndefined,
  entryId: trimOrUndefined,
  date: passThrough,
  name: trimOrUndefined,
  calories: num,
  protein: num,
  carbs: num,
  fats: num,
};
const DELETE_FOOD_ENTRY_SPEC = {
  foodName: trimOrUndefined,
  entryId: trimOrUndefined,
  date: passThrough,
};
const EDIT_CHECK_IN_SPEC = {
  date: passThrough,
  sleepHours: num,
};
const DELETE_CHECK_IN_SPEC = { date: passThrough };
const EDIT_GOAL_SPEC = {
  goalType: passThrough,
  goalId: passThrough,
  target: num,
  period: passThrough,
};
const DELETE_GOAL_SPEC = {
  goalType: passThrough,
  goalId: passThrough,
};

function buildEditSchedule(args) {
  return mapArgs(args, EDIT_SCHEDULE_SPEC);
}
function buildDeleteSchedule(args) {
  return mapArgs(args, DELETE_SCHEDULE_SPEC);
}

function buildAddTransaction(args, ctx) {
  const type = args.type === 'income' || args.type === 'expense' ? args.type : 'expense';
  const amount = Number(args.amount);
  const numAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  return {
    type,
    amount: numAmount,
    category: normCat(args.category, type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense),
    description: args.description ? trim(args.description) : undefined,
    date: parseDate(args.date, ctx.todayStr),
    isRecurring: !!args.isRecurring,
  };
}

function buildEditTransaction(args) {
  return mapArgs(args, EDIT_TRANSACTION_SPEC);
}
function buildDeleteTransaction(args) {
  return mapArgs(args, DELETE_TRANSACTION_SPEC);
}

function buildAddWorkout(args, ctx) {
  return {
    date: parseDate(args.date, ctx.todayStr),
    title: args.title ? trim(args.title) : 'Workout',
    type: WORKOUT_TYPES.includes(args.type) ? args.type : 'cardio',
    durationMinutes: Number.isFinite(Number(args.durationMinutes)) ? Number(args.durationMinutes) : 30,
    notes: args.notes ? trim(args.notes) : undefined,
  };
}

function buildEditWorkout(args) {
  return mapArgs(args, EDIT_WORKOUT_SPEC);
}
function buildDeleteWorkout(args) {
  return mapArgs(args, DELETE_WORKOUT_SPEC);
}

function buildAddSchedule(args, ctx) {
  let items = Array.isArray(args.items) ? args.items : [];
  items = items
    .filter((it) => it && typeof it.title === 'string' && it.title.trim())
    .map((it) => ({
      title: String(it.title).trim(),
      startTime: normTime(it.startTime) ?? '09:00',
      endTime: normTime(it.endTime) ?? '10:00',
      category: normCat(it.category, SCHEDULE_CATEGORIES),
      recurrence: VALID_RECURRENCE.includes(it.recurrence) ? it.recurrence : undefined,
    }));
  return { items };
}

async function buildAddFood(args, ctx) {
  const food = args.food ? trim(args.food) : '';
  const amount = Number(args.amount);
  const numAmount = Number.isFinite(amount) && amount > 0 ? amount : 100;
  const unit = args.unit ? String(args.unit).trim().toLowerCase() : 'g';
  const action = {
    food,
    amount: numAmount,
    unit,
    date: parseDate(args.date, ctx.todayStr),
  };
  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const nutrition = await getNutritionForFoodName(pool, food || 'unknown', numAmount, unit);
      if (nutrition) {
        action.name = nutrition.name;
        action.calories = nutrition.calories;
        action.protein = nutrition.protein;
        action.carbs = nutrition.carbs;
        action.fats = nutrition.fats;
      }
    } catch (e) {
      console.error('add_food DB lookup:', e?.message ?? e);
    }
  }
  return action;
}

function buildEditFoodEntry(args) {
  return mapArgs(args, EDIT_FOOD_ENTRY_SPEC);
}
function buildDeleteFoodEntry(args) {
  return mapArgs(args, DELETE_FOOD_ENTRY_SPEC);
}

function buildLogSleep(args, ctx) {
  const sh = Number(args.sleepHours);
  return {
    sleepHours: Number.isFinite(sh) && sh >= 0 ? sh : 0,
    date: parseDate(args.date, ctx.todayStr),
  };
}

function buildEditCheckIn(args) {
  return mapArgs(args, EDIT_CHECK_IN_SPEC);
}
function buildDeleteCheckIn(args) {
  return mapArgs(args, DELETE_CHECK_IN_SPEC);
}

function buildAddGoal(args) {
  return {
    type: GOAL_TYPES.includes(args.type) ? args.type : 'workouts',
    target: Number.isFinite(Number(args.target)) ? Number(args.target) : 0,
    period: GOAL_PERIODS.includes(args.period) ? args.period : 'weekly',
  };
}

function buildEditGoal(args) {
  return mapArgs(args, EDIT_GOAL_SPEC);
}
function buildDeleteGoal(args) {
  return mapArgs(args, DELETE_GOAL_SPEC);
}

/** Handlers return { merge } or { items }. All invoked via Promise.resolve for uniform async/sync. */
const HANDLERS = {
  add_schedule: (args, ctx) => Promise.resolve(buildAddSchedule(args, ctx)),
  edit_schedule: (args, ctx) => Promise.resolve({ merge: buildEditSchedule(args, ctx) }),
  delete_schedule: (args, ctx) => Promise.resolve({ merge: buildDeleteSchedule(args, ctx) }),
  add_transaction: (args, ctx) => Promise.resolve({ merge: buildAddTransaction(args, ctx) }),
  edit_transaction: (args, ctx) => Promise.resolve({ merge: buildEditTransaction(args, ctx) }),
  delete_transaction: (args, ctx) => Promise.resolve({ merge: buildDeleteTransaction(args, ctx) }),
  add_workout: (args, ctx) => Promise.resolve({ merge: buildAddWorkout(args, ctx) }),
  edit_workout: (args, ctx) => Promise.resolve({ merge: buildEditWorkout(args, ctx) }),
  delete_workout: (args, ctx) => Promise.resolve({ merge: buildDeleteWorkout(args, ctx) }),
  add_food: (args, ctx) => buildAddFood(args, ctx).then((merge) => ({ merge })),
  edit_food_entry: (args, ctx) => Promise.resolve({ merge: buildEditFoodEntry(args, ctx) }),
  delete_food_entry: (args, ctx) => Promise.resolve({ merge: buildDeleteFoodEntry(args, ctx) }),
  log_sleep: (args, ctx) => Promise.resolve({ merge: buildLogSleep(args, ctx) }),
  edit_check_in: (args, ctx) => Promise.resolve({ merge: buildEditCheckIn(args, ctx) }),
  delete_check_in: (args, ctx) => Promise.resolve({ merge: buildDeleteCheckIn(args, ctx) }),
  add_goal: (args, ctx) => Promise.resolve({ merge: buildAddGoal(args, ctx) }),
  edit_goal: (args, ctx) => Promise.resolve({ merge: buildEditGoal(args, ctx) }),
  delete_goal: (args, ctx) => Promise.resolve({ merge: buildDeleteGoal(args, ctx) }),
};

/**
 * @param {string} text
 * @param {string} [lang]
 * @returns {Promise<{ actions: object[] }>}
 */
export async function parseTranscript(text, lang = 'auto') {
  if (!config.geminiApiKey) {
    throw new Error('Voice service not configured (missing GEMINI_API_KEY)');
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const ctx = { todayStr };
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${VOICE_PROMPT}\n\nUser transcript (lang: ${lang}):\n${text}` }] }],
    tools: VOICE_TOOLS,
  });
  const response = result.response;
  if (!response) {
    throw new Error('Empty response from Gemini');
  }
  const functionCalls = response.functionCalls?.() ?? [];
  const actions = [];

  for (const fc of functionCalls) {
    const name = fc.name;
    const args = fc.args || {};
    const action = { intent: name };
    const handler = HANDLERS[name];
    const result_ = handler ? await handler(args, ctx) : {};

    if (result_.merge) Object.assign(action, result_.merge);
    if (result_.items?.length) action.items = result_.items;

    const isEmptyItems = result_.items && result_.items.length === 0;
    if (!isEmptyItems) actions.push(action);
  }

  if (actions.length === 0) {
    actions.push({ intent: 'unknown' });
  }

  return { actions };
}
