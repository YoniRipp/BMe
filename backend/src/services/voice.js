/**
 * Voice service — Gemini parsing and action mapping.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from '../config/index.js';
import { isDbConfigured, getPool } from '../db/index.js';
import { SCHEDULE_CATEGORIES, VALID_RECURRENCE, TRANSACTION_CATEGORIES, WORKOUT_TYPES, GOAL_TYPES, GOAL_PERIODS } from '../config/constants.js';
import { normTime, normCat } from '../utils/validation.js';
import { VOICE_TOOLS } from '../../voice/tools.js';
import { getNutritionForFoodName, unitToGrams } from '../models/foodSearch.js';
import { lookupAndCreateFood } from './foodLookupGemini.js';
import { logError } from './appLog.js';

const VOICE_PROMPT = `You are a voice assistant for a life management app. The user speaks in Hebrew or English.
Parse their message and call the appropriate function(s) for each action they want to take.

Food and drink rules:
- Only when the user EXPLICITLY says they paid or spent a specific amount (e.g. "bought X for 9", "paid 5 for coffee", "cost 10") do you call BOTH add_transaction (with that amount, category "Food", description = item name) AND add_food (food = item name in English).
- When the user says ONLY a food or drink name (e.g. "Diet Coke", "coffee") or "ate X" / "had X" WITHOUT any amount or purchase wording, call ONLY add_food. Do NOT call add_transaction. Do not invent or guess an amount.
- When the user says they ate or had a meal WITH a time range (e.g. "ate from 6 to 8", "had dinner 18:00-20:00", "I ate at 6-7" and describes what they ate), call BOTH add_schedule (one item: title "Meal" or the meal description, category "Meal", startTime/endTime in HH:MM 24h) AND add_food with the same startTime and endTime and the food name. When they say they ate something without a time range (e.g. "I ate today XYZ"), call ONLY add_food—no add_schedule.
Examples: "Diet Coke" or "had a Diet Coke" → add_food only. "Bought Diet Coke for 5" → add_transaction (expense, 5, Food, Diet Coke) + add_food (Diet Coke). "work 8-18, eat 18-22" → add_schedule twice. "I ate from 6 to 8, had pasta" → add_schedule (Meal 18:00-20:00) + add_food (pasta, startTime 18:00, endTime 20:00). "bought coke for 10, slept 8 hours" → add_transaction (expense, 10, Food, Coke) + add_food (Coke) + log_sleep.
Sleep: When the user talks about sleep or waking up, use log_sleep (hours) or add_schedule with category Sleep. E.g. "slept 7 hours" → log_sleep(sleepHours: 7). "woke up from 6 to 8" or "slept from 6 to 8" → log_sleep(sleepHours: 2) or add_schedule with Sleep 06:00-08:00. Do NOT use add_food for sleep-related phrases.
Workouts: When the user says they worked out and gives exercises with sets/reps/weight, call add_workout with type "strength". Use title "Workout" when they do not give a workout name; when they say a program name (e.g. SS, Starting Strength) use that as title. Do not use an exercise name as the workout title. Each exercise in the exercises array must use the exact exercise name the user said (e.g. Squat, Deadlift). Sets and reps: use sets × reps (e.g. 3 reps 5 sets = 5 sets of 3 reps; 3x3 = 3 sets, 3 reps). durationMinutes is optional (default 30).
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
function normExercises(v) {
  if (!Array.isArray(v)) return undefined;
  return v
    .filter((e) => e && typeof e.name === 'string' && e.name.trim())
    .map((e) => ({
      name: String(e.name).trim(),
      sets: Math.max(0, Number(e.sets) || 0),
      reps: Math.max(0, Number(e.reps) || 0),
      weight: Number(e.weight) > 0 ? Number(e.weight) : undefined,
      notes: e.notes ? String(e.notes).trim() : undefined,
    }));
}

/** If name has no "uncooked"/"raw" or "cooked", append ", cooked" (default). Use "uncooked" consistently (not "raw"). Used only for fallback names (not from DB). */
function withRawOrCooked(name) {
  let s = String(name).trim();
  if (!s) return 'Unknown';
  if (/\b(raw)\b/i.test(s)) s = s.replace(/\braw\b/gi, 'uncooked');
  if (/\b(uncooked|cooked)\b/i.test(s)) return s;
  return `${s}, cooked`;
}

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
  exercises: normExercises,
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
  const allowed = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense;
  let category = normCat(args.category, allowed);
  const description = args.description ? trim(args.description) : undefined;
  // Fallback: if expense ended up Other but description is a short item name (e.g. "Coke"), treat as food purchase
  if (type === 'expense' && category === 'Other' && description && description.length <= 30 && !description.includes(' ')) {
    category = 'Food';
  }
  return {
    type,
    amount: numAmount,
    currency: 'USD',
    category,
    description,
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
  const exercises = Array.isArray(args.exercises)
    ? args.exercises
        .filter((e) => e && typeof e.name === 'string' && e.name.trim())
        .map((e) => ({
          name: String(e.name).trim(),
          sets: Math.max(0, Number(e.sets) || 0),
          reps: Math.max(0, Number(e.reps) || 0),
          weight: Number(e.weight) > 0 ? Number(e.weight) : undefined,
          notes: e.notes ? String(e.notes).trim() : undefined,
        }))
    : [];
  return {
    date: parseDate(args.date, ctx.todayStr),
    title: args.title ? trim(args.title) : 'Workout',
    type: WORKOUT_TYPES.includes(args.type) ? args.type : 'cardio',
    durationMinutes: Number.isFinite(Number(args.durationMinutes)) && Number(args.durationMinutes) > 0 ? Number(args.durationMinutes) : 30,
    exercises,
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
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voice.js:buildAddFood:entry', message: 'buildAddFood args', data: { food, rawAmount: args.amount, numAmount, unit }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
  // #endregion
  const action = {
    food,
    amount: numAmount,
    unit,
    date: parseDate(args.date, ctx.todayStr),
    startTime: normTime(args.startTime) ?? undefined,
    endTime: normTime(args.endTime) ?? undefined,
    portionAmount: numAmount,
    portionUnit: unit,
  };
  if (isDbConfigured()) {
    try {
      const pool = getPool();
      const preferUncooked = /\b(uncooked|raw)\b/i.test(food || '');
      let nutrition = await getNutritionForFoodName(pool, food || 'unknown', numAmount, unit, preferUncooked);
      let source = nutrition ? 'db' : null;
      if (!nutrition && config.geminiApiKey) {
        const geminiRow = await lookupAndCreateFood(pool, food || 'unknown');
        if (geminiRow) {
          const ref = 100;
          const grams = unitToGrams(numAmount, unit);
          const scale = grams / ref;
          const displayName = (geminiRow.name || '').replace(/\braw\b/gi, 'uncooked');
          nutrition = {
            name: displayName,
            calories: Math.round(geminiRow.calories * scale),
            protein: Math.round(geminiRow.protein * scale * 10) / 10,
            carbs: Math.round(geminiRow.carbs * scale * 10) / 10,
            fat: Math.round(geminiRow.fat * scale * 10) / 10,
          };
          source = 'gemini';
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voice.js:buildAddFood:afterLookup', message: 'nutrition source', data: { source, hasNutrition: !!nutrition }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
      // #endregion
      if (nutrition) {
        action.name = nutrition.name;
        action.calories = nutrition.calories;
        action.protein = nutrition.protein;
        action.carbs = nutrition.carbs;
        action.fats = nutrition.fat;
      } else {
        action.name = withRawOrCooked(food || 'Unknown');
        action.calories = 0;
        action.protein = 0;
        action.carbs = 0;
        action.fats = 0;
      }
    } catch (e) {
      console.error('add_food DB lookup:', e?.message ?? e);
      action.name = withRawOrCooked(food || 'Unknown');
      action.calories = 0;
      action.protein = 0;
      action.carbs = 0;
      action.fats = 0;
    }
  } else if (food) {
    action.name = withRawOrCooked(food || 'Unknown');
    action.calories = 0;
    action.protein = 0;
    action.carbs = 0;
    action.fats = 0;
  }
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'voice.js:buildAddFood:return', message: 'add_food action out', data: { name: action.name, calories: action.calories, portionAmount: action.portionAmount, portionUnit: action.portionUnit }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {});
  // #endregion
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

/** True if transcript looks like a short food/drink phrase (no clear sleep/schedule/time patterns). */
function transcriptLooksLikeFood(text) {
  const t = (text || '').trim();
  if (t.length > 80) return false;
  const lower = t.toLowerCase();
  const hasTimePattern = /\d{1,2}:\d{2}|\d+\s*hours?|woke|slept|sleep|schedule|עד|מ-|שעות|השכמתי|ישנתי|שינה/i.test(t) || /\d+\s*to\s*\d|\d+\s*-\s*\d/.test(lower);
  if (hasTimePattern) return false;
  return true;
}

/** When Gemini blocks (safety/empty), treat transcript as add_food only if it looks like food; else return unknown and log error. */
function fallbackAddFoodFromTranscript(transcript, todayStr) {
  const name = (transcript || '').trim() || 'Unknown';
  return {
    actions: [
      {
        intent: 'add_food',
        food: name,
        amount: 100,
        unit: 'g',
        date: todayStr,
        name: withRawOrCooked(name),
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      },
    ],
  };
}

async function fallbackOrUnknown(transcript, todayStr, reason, userId) {
  if (transcriptLooksLikeFood(transcript)) {
    return fallbackAddFoodFromTranscript(transcript, todayStr);
  }
  await logError('Voice: no action from Gemini', { transcript: transcript?.trim?.() ?? transcript, reason }, userId);
  return { actions: [{ intent: 'unknown' }] };
}

/**
 * @param {string} text
 * @param {string} [lang]
 * @param {string} [userId] - For error logging
 * @returns {Promise<{ actions: object[] }>}
 */
export async function parseTranscript(text, lang = 'auto', userId = null) {
  if (!config.geminiApiKey) {
    throw new Error('Voice service not configured (missing GEMINI_API_KEY)');
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const ctx = { todayStr };
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];
  const model = genAI.getGenerativeModel({ model: config.geminiModel, safetySettings });

  let result;
  try {
    result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${VOICE_PROMPT}\n\nUser transcript (lang: ${lang}):\n${text}` }] }],
      tools: VOICE_TOOLS,
    });
  } catch (e) {
    console.error('Gemini voice parse blocked or error:', e?.message ?? e);
    return fallbackOrUnknown(text, todayStr, e?.message ?? String(e), userId);
  }

  const response = result.response;
  if (!response) {
    console.error('Gemini voice parse: empty response');
    return fallbackOrUnknown(text, todayStr, 'empty response', userId);
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
