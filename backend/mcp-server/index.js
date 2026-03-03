import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const BEME_API_URL = process.env.BEME_API_URL || 'http://localhost:3000';
const BEME_MCP_TOKEN = process.env.BEME_MCP_TOKEN;
const authHeaders = BEME_MCP_TOKEN ? { Authorization: `Bearer ${BEME_MCP_TOKEN}` } : {};

async function apiGet(path) {
  const res = await fetch(`${BEME_API_URL}${path}`, { headers: authHeaders });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BEME_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${BEME_API_URL}${path}`, { method: 'DELETE', headers: authHeaders });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  return null;
}

async function apiPatch(path, body) {
  const res = await fetch(`${BEME_API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function textContent(text) {
  return { content: [{ type: 'text', text }] };
}

const server = new McpServer({
  name: 'beme',
  version: '1.0.0',
});

// --- Tools ---

server.tool(
  'add_schedule_item',
  'Add one item to the daily schedule.',
  z.object({
    title: z.string().describe('Activity title'),
    startTime: z.string().optional().describe('Start time HH:MM'),
    endTime: z.string().optional().describe('End time HH:MM'),
    category: z.string().optional().describe('One of: Work, Exercise, Meal, Sleep, Personal, Social, Other'),
  }),
  async ({ title, startTime, endTime, category }) => {
    const result = await apiPost('/api/schedule', { title, startTime, endTime, category });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_schedule',
  'List schedule items (active only).',
  z.object({}),
  async () => {
    const items = await apiGet('/api/schedule');
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'delete_schedule_item',
  'Remove a schedule item by id.',
  z.object({
    id: z.string().describe('Schedule item id (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/schedule/${id}`);
    return textContent('Deleted.');
  }
);

server.tool(
  'add_transaction',
  'Add an income or expense transaction.',
  z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().min(0),
    category: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional().describe('YYYY-MM-DD'),
    isRecurring: z.boolean().optional(),
  }),
  async (args) => {
    const result = await apiPost('/api/transactions', args);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_transactions',
  'List transactions. Optional: month (YYYY-MM), type (income|expense).',
  z.object({
    month: z.string().optional().describe('YYYY-MM'),
    type: z.enum(['income', 'expense']).optional(),
  }),
  async ({ month, type } = {}) => {
    const q = new URLSearchParams();
    if (month) q.set('month', month);
    if (type) q.set('type', type);
    const items = await apiGet('/api/transactions' + (q.toString() ? '?' + q : ''));
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'get_balance',
  'Get current balance (income - expenses). Optional: month (YYYY-MM).',
  z.object({
    month: z.string().optional().describe('YYYY-MM'),
  }),
  async ({ month } = {}) => {
    const path = month ? `/api/balance?month=${encodeURIComponent(month)}` : '/api/balance';
    const result = await apiGet(path);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'add_goal',
  'Add a goal.',
  z.object({
    type: z.enum(['calories', 'workouts', 'savings']),
    target: z.number().min(0),
    period: z.enum(['weekly', 'monthly', 'yearly']),
  }),
  async (args) => {
    const result = await apiPost('/api/goals', args);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_goals',
  'List all goals.',
  z.object({}),
  async () => {
    const items = await apiGet('/api/goals');
    return textContent(JSON.stringify(items, null, 2));
  }
);

// --- Workout Tools ---

server.tool(
  'add_workout',
  'Log a workout with optional exercises.',
  z.object({
    title: z.string().describe('Workout name (e.g. "Morning Run", "Strength Training")'),
    type: z.enum(['strength', 'cardio', 'flexibility', 'sports']).describe('Workout type'),
    durationMinutes: z.number().optional().describe('Duration in minutes (default 30)'),
    date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
    notes: z.string().optional().describe('Optional notes'),
    exercises: z.array(z.object({
      name: z.string().describe('Exercise name'),
      sets: z.number().describe('Number of sets'),
      reps: z.number().describe('Reps per set'),
      weight: z.number().optional().describe('Weight in kg'),
    })).optional().describe('List of exercises for strength workouts'),
  }),
  async ({ title, type, durationMinutes, date, notes, exercises }) => {
    const result = await apiPost('/api/workouts', {
      title,
      type,
      durationMinutes: durationMinutes ?? 30,
      date: date ?? new Date().toISOString().slice(0, 10),
      notes,
      exercises: exercises ?? [],
    });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_workouts',
  'List logged workouts. Optional date filter.',
  z.object({
    date: z.string().optional().describe('YYYY-MM-DD to filter by date'),
    limit: z.number().optional().describe('Max results (default 10)'),
  }),
  async ({ date, limit } = {}) => {
    const q = new URLSearchParams();
    if (date) q.set('date', date);
    if (limit) q.set('limit', String(limit));
    const queryStr = q.toString();
    const items = await apiGet('/api/workouts' + (queryStr ? '?' + queryStr : ''));
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'delete_workout',
  'Remove a workout by ID.',
  z.object({
    id: z.string().describe('Workout ID (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/workouts/${id}`);
    return textContent('Deleted.');
  }
);

// --- Food Entry Tools ---

server.tool(
  'add_food_entry',
  'Log food consumed with nutrition info.',
  z.object({
    name: z.string().describe('Food name'),
    calories: z.number().optional().describe('Calories'),
    protein: z.number().optional().describe('Protein in grams'),
    carbs: z.number().optional().describe('Carbohydrates in grams'),
    fats: z.number().optional().describe('Fat in grams'),
    portionAmount: z.number().optional().describe('Portion amount (e.g. 100)'),
    portionUnit: z.string().optional().describe('Portion unit (e.g. g, ml, serving)'),
    date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
  }),
  async ({ name, calories, protein, carbs, fats, portionAmount, portionUnit, date }) => {
    const result = await apiPost('/api/food-entries', {
      name,
      calories: calories ?? 0,
      protein: protein ?? 0,
      carbs: carbs ?? 0,
      fats: fats ?? 0,
      portionAmount,
      portionUnit,
      date: date ?? new Date().toISOString().slice(0, 10),
    });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_food_entries',
  'List food entries. Optional date filter.',
  z.object({
    date: z.string().optional().describe('YYYY-MM-DD to filter by date'),
  }),
  async ({ date } = {}) => {
    const q = new URLSearchParams();
    if (date) q.set('date', date);
    const queryStr = q.toString();
    const items = await apiGet('/api/food-entries' + (queryStr ? '?' + queryStr : ''));
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'delete_food_entry',
  'Remove a food entry by ID.',
  z.object({
    id: z.string().describe('Food entry ID (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/food-entries/${id}`);
    return textContent('Deleted.');
  }
);

// --- Sleep/Check-in Tools ---

server.tool(
  'log_sleep',
  'Log sleep hours for a date.',
  z.object({
    sleepHours: z.number().min(0).max(24).describe('Hours slept'),
    date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
  }),
  async ({ sleepHours, date }) => {
    const result = await apiPost('/api/daily-check-ins', {
      sleepHours,
      date: date ?? new Date().toISOString().slice(0, 10),
    });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'get_daily_summary',
  'Get combined daily summary: workouts, food, schedule, sleep.',
  z.object({
    date: z.string().optional().describe('YYYY-MM-DD, defaults to today'),
  }),
  async ({ date } = {}) => {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    
    const [workouts, food, schedule, checkIns] = await Promise.all([
      apiGet(`/api/workouts?date=${targetDate}`).catch(() => []),
      apiGet(`/api/food-entries?date=${targetDate}`).catch(() => []),
      apiGet('/api/schedule').catch(() => []),
      apiGet('/api/daily-check-ins').catch(() => []),
    ]);
    
    const todayCheckIn = checkIns.find(c => c.date?.startsWith(targetDate));
    const totalCalories = food.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = food.reduce((sum, f) => sum + (f.protein || 0), 0);
    
    const summary = {
      date: targetDate,
      workouts: {
        count: workouts.length,
        totalMinutes: workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0),
        items: workouts,
      },
      nutrition: {
        totalCalories,
        totalProtein,
        entryCount: food.length,
        items: food,
      },
      schedule: {
        itemCount: schedule.length,
        items: schedule,
      },
      sleep: {
        hours: todayCheckIn?.sleepHours ?? null,
      },
    };
    
    return textContent(JSON.stringify(summary, null, 2));
  }
);

// --- Update Tools ---

server.tool(
  'update_schedule_item',
  'Update an existing schedule item by ID.',
  z.object({
    id: z.string().describe('Schedule item ID (UUID)'),
    title: z.string().optional().describe('New activity title'),
    startTime: z.string().optional().describe('New start time HH:MM'),
    endTime: z.string().optional().describe('New end time HH:MM'),
    category: z.string().optional().describe('One of: Work, Exercise, Meal, Sleep, Personal, Social, Other'),
  }),
  async ({ id, ...updates }) => {
    const result = await apiPatch(`/api/schedule/${id}`, updates);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'update_workout',
  'Update an existing workout by ID.',
  z.object({
    id: z.string().describe('Workout ID (UUID)'),
    title: z.string().optional().describe('New workout name'),
    type: z.enum(['strength', 'cardio', 'flexibility', 'sports']).optional().describe('New workout type'),
    durationMinutes: z.number().optional().describe('New duration in minutes'),
    date: z.string().optional().describe('New date YYYY-MM-DD'),
    notes: z.string().optional().describe('New notes'),
  }),
  async ({ id, ...updates }) => {
    const result = await apiPatch(`/api/workouts/${id}`, updates);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'update_food_entry',
  'Update an existing food entry by ID.',
  z.object({
    id: z.string().describe('Food entry ID (UUID)'),
    name: z.string().optional().describe('New food name'),
    calories: z.number().optional().describe('New calories'),
    protein: z.number().optional().describe('New protein in grams'),
    carbs: z.number().optional().describe('New carbohydrates in grams'),
    fats: z.number().optional().describe('New fat in grams'),
    portionAmount: z.number().optional().describe('New portion amount'),
    portionUnit: z.string().optional().describe('New portion unit'),
  }),
  async ({ id, ...updates }) => {
    const result = await apiPatch(`/api/food-entries/${id}`, updates);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'update_transaction',
  'Update an existing transaction by ID.',
  z.object({
    id: z.string().describe('Transaction ID (UUID)'),
    type: z.enum(['income', 'expense']).optional().describe('New transaction type'),
    amount: z.number().min(0).optional().describe('New amount'),
    category: z.string().optional().describe('New category'),
    description: z.string().optional().describe('New description'),
    date: z.string().optional().describe('New date YYYY-MM-DD'),
  }),
  async ({ id, ...updates }) => {
    const result = await apiPatch(`/api/transactions/${id}`, updates);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'update_goal',
  'Update an existing goal by ID.',
  z.object({
    id: z.string().describe('Goal ID (UUID)'),
    type: z.enum(['calories', 'workouts', 'savings']).optional().describe('New goal type'),
    target: z.number().min(0).optional().describe('New target value'),
    period: z.enum(['weekly', 'monthly', 'yearly']).optional().describe('New period'),
  }),
  async ({ id, ...updates }) => {
    const result = await apiPatch(`/api/goals/${id}`, updates);
    return textContent(JSON.stringify(result, null, 2));
  }
);

// --- Additional Delete Tools ---

server.tool(
  'delete_transaction',
  'Remove a transaction by ID.',
  z.object({
    id: z.string().describe('Transaction ID (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/transactions/${id}`);
    return textContent('Deleted.');
  }
);

server.tool(
  'delete_goal',
  'Remove a goal by ID.',
  z.object({
    id: z.string().describe('Goal ID (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/goals/${id}`);
    return textContent('Deleted.');
  }
);

server.tool(
  'delete_daily_check_in',
  'Remove a daily check-in by ID.',
  z.object({
    id: z.string().describe('Daily check-in ID (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/daily-check-ins/${id}`);
    return textContent('Deleted.');
  }
);

// --- Voice Testing Tool ---

server.tool(
  'voice_understand',
  'Parse a voice transcript and return the actions that would be generated (for testing voice commands).',
  z.object({
    transcript: z.string().describe('The voice transcript to parse'),
  }),
  async ({ transcript }) => {
    const result = await apiPost('/api/voice/understand', { transcript });
    return textContent(JSON.stringify(result, null, 2));
  }
);

// --- Feature Tools ---

server.tool(
  'get_insights',
  'Get AI-generated insights and recommendations based on user data.',
  z.object({}),
  async () => {
    const result = await apiGet('/api/insights');
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'get_stats',
  'Get aggregated statistics (workouts, calories, spending, etc.).',
  z.object({}),
  async () => {
    const result = await apiGet('/api/insights/stats');
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'semantic_search',
  'Search across all user data using natural language (vector search).',
  z.object({
    query: z.string().describe('Natural language search query'),
    limit: z.number().optional().describe('Max results (default 10)'),
  }),
  async ({ query, limit }) => {
    const result = await apiPost('/api/search', { query, limit: limit ?? 10 });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'get_subscription_status',
  'Get current subscription status (free, pro, cancelled, etc.).',
  z.object({}),
  async () => {
    const result = await apiGet('/api/subscription/status');
    return textContent(JSON.stringify(result, null, 2));
  }
);

// --- Resources ---

server.resource(
  'schedule_today',
  'beme://schedule/today',
  { title: "Today's schedule" },
  async (uri) => {
    const items = await apiGet('/api/schedule');
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'transactions_this_month',
  'beme://transactions/this_month',
  { title: "This month's transactions" },
  async (uri) => {
    const month = new Date().toISOString().slice(0, 7);
    const items = await apiGet(`/api/transactions?month=${month}`);
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'goals',
  'beme://goals',
  { title: 'Current goals' },
  async (uri) => {
    const items = await apiGet('/api/goals');
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'workouts_today',
  'beme://workouts/today',
  { title: "Today's workouts" },
  async (uri) => {
    const today = new Date().toISOString().slice(0, 10);
    const items = await apiGet(`/api/workouts?date=${today}`);
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'food_today',
  'beme://food/today',
  { title: "Today's food entries" },
  async (uri) => {
    const today = new Date().toISOString().slice(0, 10);
    const items = await apiGet(`/api/food-entries?date=${today}`);
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'daily_summary',
  'beme://summary/today',
  { title: "Today's summary (workouts, food, schedule, sleep)" },
  async (uri) => {
    const today = new Date().toISOString().slice(0, 10);
    
    const [workouts, food, schedule, checkIns] = await Promise.all([
      apiGet(`/api/workouts?date=${today}`).catch(() => []),
      apiGet(`/api/food-entries?date=${today}`).catch(() => []),
      apiGet('/api/schedule').catch(() => []),
      apiGet('/api/daily-check-ins').catch(() => []),
    ]);
    
    const todayCheckIn = checkIns.find(c => c.date?.startsWith(today));
    
    const summary = {
      date: today,
      workouts: workouts.length,
      totalCalories: food.reduce((sum, f) => sum + (f.calories || 0), 0),
      scheduleItems: schedule.length,
      sleepHours: todayCheckIn?.sleepHours ?? null,
    };
    
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(summary, null, 2) }],
    };
  }
);

server.resource(
  'insights',
  'beme://insights',
  { title: 'AI-generated insights and recommendations' },
  async (uri) => {
    const result = await apiGet('/api/insights').catch(() => ({ insights: [], error: 'Failed to fetch insights' }));
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.resource(
  'weekly_stats',
  'beme://stats/weekly',
  { title: 'Weekly aggregated statistics' },
  async (uri) => {
    const result = await apiGet('/api/insights/stats').catch(() => ({ error: 'Failed to fetch stats' }));
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.resource(
  'subscription_status',
  'beme://subscription/status',
  { title: 'Current subscription status' },
  async (uri) => {
    const result = await apiGet('/api/subscription/status').catch(() => ({ status: 'unknown', error: 'Failed to fetch status' }));
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Run ---

const transport = new StdioServerTransport();
await server.connect(transport);
