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

    if (name === 'add_schedule') {
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
      if (items.length > 0) {
        action.items = items;
        actions.push(action);
      }
      continue;
    } else if (name === 'edit_schedule') {
      if (args.itemTitle) action.itemTitle = String(args.itemTitle).trim();
      if (args.itemId) action.itemId = String(args.itemId).trim();
      if (args.startTime) action.startTime = normTime(args.startTime);
      if (args.endTime) action.endTime = normTime(args.endTime);
      if (args.title) action.title = String(args.title).trim();
      if (args.category) action.category = normCat(args.category, SCHEDULE_CATEGORIES);
    } else if (name === 'delete_schedule') {
      if (args.itemTitle) action.itemTitle = String(args.itemTitle).trim();
      if (args.itemId) action.itemId = String(args.itemId).trim();
    } else if (name === 'add_transaction') {
      const type = args.type === 'income' || args.type === 'expense' ? args.type : 'expense';
      const amount = Number(args.amount);
      const numAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
      action.type = type;
      action.amount = numAmount;
      action.category = normCat(args.category, type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense);
      if (args.description) action.description = String(args.description).trim();
      action.date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : todayStr;
      action.isRecurring = !!args.isRecurring;
    } else if (name === 'edit_transaction') {
      if (args.description) action.description = String(args.description).trim();
      if (args.transactionId) action.transactionId = String(args.transactionId).trim();
      if (args.date) action.date = args.date;
      if (args.type) action.type = args.type;
      if (args.amount != null) action.amount = Number(args.amount);
      if (args.category) action.category = args.category;
    } else if (name === 'delete_transaction') {
      if (args.description) action.description = String(args.description).trim();
      if (args.transactionId) action.transactionId = String(args.transactionId).trim();
      if (args.date) action.date = args.date;
    } else if (name === 'add_workout') {
      action.date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : todayStr;
      action.title = args.title ? String(args.title).trim() : 'Workout';
      action.type = WORKOUT_TYPES.includes(args.type) ? args.type : 'cardio';
      action.durationMinutes = Number.isFinite(Number(args.durationMinutes)) ? Number(args.durationMinutes) : 30;
      if (args.notes) action.notes = String(args.notes).trim();
    } else if (name === 'edit_workout') {
      if (args.workoutTitle) action.workoutTitle = String(args.workoutTitle).trim();
      if (args.workoutId) action.workoutId = String(args.workoutId).trim();
      if (args.date) action.date = args.date;
      if (args.title) action.title = String(args.title).trim();
      if (args.type) action.type = args.type;
      if (args.durationMinutes != null) action.durationMinutes = Number(args.durationMinutes);
      if (args.notes !== undefined) action.notes = args.notes;
    } else if (name === 'delete_workout') {
      if (args.workoutTitle) action.workoutTitle = String(args.workoutTitle).trim();
      if (args.workoutId) action.workoutId = String(args.workoutId).trim();
      if (args.date) action.date = args.date;
    } else if (name === 'add_food') {
      const food = args.food ? String(args.food).trim() : '';
      const amount = Number(args.amount);
      const numAmount = Number.isFinite(amount) && amount > 0 ? amount : 100;
      const unit = args.unit ? String(args.unit).trim().toLowerCase() : 'g';
      action.food = food;
      action.amount = numAmount;
      action.unit = unit;
      action.date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : todayStr;
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
    } else if (name === 'edit_food_entry') {
      if (args.foodName) action.foodName = String(args.foodName).trim();
      if (args.entryId) action.entryId = String(args.entryId).trim();
      if (args.date) action.date = args.date;
      if (args.name) action.name = String(args.name).trim();
      if (args.calories != null) action.calories = Number(args.calories);
      if (args.protein != null) action.protein = Number(args.protein);
      if (args.carbs != null) action.carbs = Number(args.carbs);
      if (args.fats != null) action.fats = Number(args.fats);
    } else if (name === 'delete_food_entry') {
      if (args.foodName) action.foodName = String(args.foodName).trim();
      if (args.entryId) action.entryId = String(args.entryId).trim();
      if (args.date) action.date = args.date;
    } else if (name === 'log_sleep') {
      const sh = Number(args.sleepHours);
      action.sleepHours = Number.isFinite(sh) && sh >= 0 ? sh : 0;
      action.date = args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date) ? args.date : todayStr;
    } else if (name === 'edit_check_in') {
      if (args.date) action.date = args.date;
      if (args.sleepHours != null) action.sleepHours = Number(args.sleepHours);
    } else if (name === 'delete_check_in') {
      if (args.date) action.date = args.date;
    } else if (name === 'add_goal') {
      action.type = GOAL_TYPES.includes(args.type) ? args.type : 'workouts';
      action.target = Number.isFinite(Number(args.target)) ? Number(args.target) : 0;
      action.period = GOAL_PERIODS.includes(args.period) ? args.period : 'weekly';
    } else if (name === 'edit_goal') {
      if (args.goalType) action.goalType = args.goalType;
      if (args.goalId) action.goalId = args.goalId;
      if (args.target != null) action.target = Number(args.target);
      if (args.period) action.period = args.period;
    } else if (name === 'delete_goal') {
      if (args.goalType) action.goalType = args.goalType;
      if (args.goalId) action.goalId = args.goalId;
    }

    actions.push(action);
  }

  if (actions.length === 0) {
    actions.push({ intent: 'unknown' });
  }

  return { actions };
}
