import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isDbConfigured, initSchema } from './db.js';
import * as scheduleRoutes from './routes/schedule.js';
import * as transactionRoutes from './routes/transactions.js';
import * as goalRoutes from './routes/goals.js';
import * as foodSearchRoutes from './routes/foodSearch.js';
import * as authRoutes from './routes/auth.js';
import * as workoutRoutes from './routes/workouts.js';
import * as foodEntryRoutes from './routes/foodEntries.js';
import * as dailyCheckInRoutes from './routes/dailyCheckIns.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import * as userRoutes from './routes/users.js';
import { getNutritionForIngredient } from './lib/ninjas.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Voice /understand endpoint will return an error.');
}
if (!isDbConfigured()) {
  console.warn('DATABASE_URL is not set. Data API and MCP require a database.');
}

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({ origin: corsOrigin || true }));
app.use(express.json());

// Auth and Data API — only if DB is configured
if (isDbConfigured()) {
  app.post('/api/auth/register', authRoutes.register);
  app.post('/api/auth/login', authRoutes.login);
  app.get('/api/auth/me', requireAuth, authRoutes.me);

  app.get('/api/schedule', requireAuth, scheduleRoutes.listSchedule);
  app.post('/api/schedule', requireAuth, scheduleRoutes.addScheduleItem);
  app.post('/api/schedule/batch', requireAuth, scheduleRoutes.addScheduleItems);
  app.patch('/api/schedule/:id', requireAuth, scheduleRoutes.updateScheduleItem);
  app.delete('/api/schedule/:id', requireAuth, scheduleRoutes.deleteScheduleItem);
  app.get('/api/transactions', requireAuth, transactionRoutes.listTransactions);
  app.post('/api/transactions', requireAuth, transactionRoutes.addTransaction);
  app.patch('/api/transactions/:id', requireAuth, transactionRoutes.updateTransaction);
  app.delete('/api/transactions/:id', requireAuth, transactionRoutes.deleteTransaction);
  app.get('/api/balance', requireAuth, transactionRoutes.getBalance);
  app.get('/api/goals', requireAuth, goalRoutes.listGoals);
  app.post('/api/goals', requireAuth, goalRoutes.addGoal);
  app.patch('/api/goals/:id', requireAuth, goalRoutes.updateGoal);
  app.delete('/api/goals/:id', requireAuth, goalRoutes.deleteGoal);

  app.get('/api/workouts', requireAuth, workoutRoutes.listWorkouts);
  app.post('/api/workouts', requireAuth, workoutRoutes.addWorkout);
  app.patch('/api/workouts/:id', requireAuth, workoutRoutes.updateWorkout);
  app.delete('/api/workouts/:id', requireAuth, workoutRoutes.deleteWorkout);

  app.get('/api/food-entries', requireAuth, foodEntryRoutes.listFoodEntries);
  app.post('/api/food-entries', requireAuth, foodEntryRoutes.addFoodEntry);
  app.patch('/api/food-entries/:id', requireAuth, foodEntryRoutes.updateFoodEntry);
  app.delete('/api/food-entries/:id', requireAuth, foodEntryRoutes.deleteFoodEntry);

  app.get('/api/daily-check-ins', requireAuth, dailyCheckInRoutes.listDailyCheckIns);
  app.post('/api/daily-check-ins', requireAuth, dailyCheckInRoutes.addDailyCheckIn);
  app.patch('/api/daily-check-ins/:id', requireAuth, dailyCheckInRoutes.updateDailyCheckIn);
  app.delete('/api/daily-check-ins/:id', requireAuth, dailyCheckInRoutes.deleteDailyCheckIn);

  app.get('/api/users', requireAuth, requireAdmin, userRoutes.listUsers);
  app.post('/api/users', requireAuth, requireAdmin, userRoutes.createUser);
  app.patch('/api/users/:id', requireAuth, requireAdmin, userRoutes.updateUser);
  app.delete('/api/users/:id', requireAuth, requireAdmin, userRoutes.deleteUser);
}

app.get('/api/food/search', foodSearchRoutes.searchFoods);

const SCHEDULE_CATEGORIES_LIST = ['Work', 'Exercise', 'Meal', 'Sleep', 'Personal', 'Social', 'Other'];
const SCHEDULE_CATEGORIES = SCHEDULE_CATEGORIES_LIST.join(', ');

const TRANSACTION_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Housing', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Other'],
};
const TRANSACTION_INCOME_STR = TRANSACTION_CATEGORIES.income.join(', ');
const TRANSACTION_EXPENSE_STR = TRANSACTION_CATEGORIES.expense.join(', ');

const SYSTEM_PROMPT = `You are a voice intent parser for a life management app. The user speaks in Hebrew or English.
Given the user's transcript, respond with a single JSON object only (no markdown, no extra text).

intent: exactly one of: "add_schedule" | "delete_schedule" | "add_transaction" | "add_food" | "log_sleep" | "unknown"

Include only the fields relevant to the chosen intent:

1) add_schedule: Include "items" (array). Each item: title (string), startTime (HH:MM 24h), endTime (HH:MM 24h), category (one of: ${SCHEDULE_CATEGORIES}).
   Triggers: "add X", "הוסף X", "schedule X", adding activities to the day.

2) delete_schedule: Include "itemTitle" (string, the activity name to remove, e.g. "workout") and optionally "itemId" (string) if user said an id.
   Triggers: "remove X", "delete X", "מחק X", "הסר X", cancel/remove from schedule.

3) add_transaction: Include "type" ("income" or "expense"), "amount" (number), "category" (string), optional "description", optional "date" (YYYY-MM-DD).
   Income categories: ${TRANSACTION_INCOME_STR}. Expense categories: ${TRANSACTION_EXPENSE_STR}.
   Triggers: "add expense", "add income", "הוסף הוצאה", "הוסף הכנסה", "spent X", "earned X", salary, etc.

4) add_food: Include "food" (string, simple English generic name), "amount" (number), "unit" (string: g, kg, ml, L, cup, tbsp, tsp, slice, piece, serving, etc.), optional "date" (YYYY-MM-DD).
   Do NOT include name, calories, protein, carbs, or fats — the backend will fetch nutrition. Translate any language to English. If no quantity is said, use amount 100 and unit "g".
   Triggers: "log food", "add food", "ate X", "אכלתי X", "הוסף אוכל", food logging.

5) log_sleep: Include "sleepHours" (number), optional "date" (YYYY-MM-DD).
   Triggers: "slept X hours", "ישנתי X שעות", "log sleep", sleep duration.

6) unknown: No extra fields. Use when intent is unclear.

Rules:
- For add_schedule: multiple activities → multiple objects in items. Times: "at 9", "ב-9" → HH:MM. Default startTime "09:00", endTime "10:00". Category from activity type (work/עבודה→Work, exercise/אימון→Exercise, etc.).
- For delete_schedule: itemTitle is the activity name (e.g. "workout", "אימון").
- For add_transaction: amount must be a number (>= 0). category must be from the lists above or "Other".
- For add_food: always output food (English), amount (number), unit (e.g. g, cup, slice). Default amount 100, unit "g" if not said.
- For log_sleep: sleepHours is a number (e.g. 7).
- Return only one intent per utterance. Prefer the most specific match.`;

app.post('/api/voice/understand', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Voice service not configured (missing GEMINI_API_KEY)' });
  }
  const { transcript, lang } = req.body ?? {};
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid transcript' });
  }
  const text = transcript.trim();
  if (!text) {
    return res.status(400).json({ error: 'Transcript is empty' });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use GEMINI_MODEL in .env to override (e.g. gemini-pro, gemini-1.5-flash-002)
    const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelId });
    const prompt = `${SYSTEM_PROMPT}\n\nUser transcript (lang hint: ${lang ?? 'auto'}):\n${text}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    if (!response || !response.text()) {
      return res.status(502).json({ error: 'Empty response from Gemini' });
    }
    let raw = response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      raw = jsonMatch[0];
    }
    const parsed = JSON.parse(raw);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backend/index.js:parsed', message: 'Gemini raw parsed', data: { transcript: text.slice(0, 80), parsedIntent: parsed.intent, parsedKeys: Object.keys(parsed), parsed }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1,H2,H3' }) }).catch(() => {});
    // #endregion

    const validIntents = ['add_schedule', 'delete_schedule', 'add_transaction', 'add_food', 'log_sleep', 'unknown'];
    const intent = validIntents.includes(parsed.intent) ? parsed.intent : 'unknown';

    const todayStr = new Date().toISOString().slice(0, 10);

    const out = { intent };

    if (intent === 'add_schedule') {
      let items = [];
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        items = parsed.items
          .filter((it) => it && typeof it.title === 'string' && it.title.trim())
          .map((it) => {
            let category = typeof it.category === 'string' ? it.category : 'Other';
            if (!SCHEDULE_CATEGORIES_LIST.includes(category)) category = 'Other';
            return {
              title: it.title.trim(),
              startTime: /^\d{1,2}:\d{2}$/.test(it.startTime) ? it.startTime : '09:00',
              endTime: /^\d{1,2}:\d{2}$/.test(it.endTime) ? it.endTime : '10:00',
              category,
            };
          });
      } else if (typeof parsed.title === 'string' && parsed.title.trim()) {
        let category = typeof parsed.category === 'string' ? parsed.category : 'Other';
        if (!SCHEDULE_CATEGORIES_LIST.includes(category)) category = 'Other';
        items = [{
          title: parsed.title.trim(),
          startTime: /^\d{1,2}:\d{2}$/.test(parsed.startTime) ? parsed.startTime : '09:00',
          endTime: /^\d{1,2}:\d{2}$/.test(parsed.endTime) ? parsed.endTime : '10:00',
          category,
        }];
      }
      out.items = items;
    }

    if (intent === 'delete_schedule') {
      out.itemTitle = typeof parsed.itemTitle === 'string' ? parsed.itemTitle.trim() : undefined;
      out.itemId = typeof parsed.itemId === 'string' ? parsed.itemId.trim() : undefined;
    }

    if (intent === 'add_transaction') {
      const type = parsed.type === 'income' || parsed.type === 'expense' ? parsed.type : 'expense';
      const amount = typeof parsed.amount === 'number' && parsed.amount >= 0 ? parsed.amount : Number(parsed.amount);
      const numAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
      const cats = type === 'income' ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense;
      let category = typeof parsed.category === 'string' ? parsed.category.trim() : 'Other';
      if (!cats.includes(category)) category = 'Other';
      out.type = type;
      out.amount = numAmount;
      out.category = category;
      out.description = typeof parsed.description === 'string' ? parsed.description.trim() : undefined;
      out.date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : todayStr;
    }

    if (intent === 'add_food') {
      const food = typeof parsed.food === 'string' ? parsed.food.trim() : (typeof parsed.name === 'string' ? parsed.name.trim() : '');
      const amount = typeof parsed.amount === 'number' && parsed.amount > 0 ? parsed.amount : Number(parsed.amount);
      const numAmount = Number.isFinite(amount) && amount > 0 ? amount : 100;
      const unit = typeof parsed.unit === 'string' && parsed.unit.trim() ? parsed.unit.trim().toLowerCase() : 'g';
      const ingr = `${numAmount}${unit} ${food || 'unknown'}`;
      try {
        const nutrition = await getNutritionForIngredient(ingr);
        out.name = nutrition.name;
        out.calories = nutrition.calories;
        out.protein = nutrition.protein;
        out.carbs = nutrition.carbs;
        out.fats = nutrition.fats;
      } catch (e) {
        console.error('Nutrition API add_food:', e?.message ?? e);
        return res.status(502).json({
          error: 'Could not get nutrition for this food',
          details: e?.message ?? String(e),
        });
      }
      out.date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : todayStr;
    }

    if (intent === 'log_sleep') {
      const sleepHours = Number(parsed.sleepHours);
      out.sleepHours = Number.isFinite(sleepHours) && sleepHours >= 0 ? sleepHours : 0;
      out.date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : todayStr;
    }

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backend/index.js:out', message: 'Response sent to frontend', data: { intent, out }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1,H2' }) }).catch(() => {});
    // #endregion
    return res.json(out);
  } catch (e) {
    console.error('Gemini / voice understand error:', e?.message ?? e);
    return res.status(502).json({
      error: 'Failed to understand voice',
      details: e?.message ?? String(e),
    });
  }
});

async function start() {
  if (isDbConfigured()) {
    try {
      await initSchema();
      console.log('Database schema initialized.');
    } catch (e) {
      console.error('Database init failed:', e?.message ?? e);
    }
  }
  app.listen(PORT, () => {
    console.log(`BMe backend listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error('Start failed:', e);
  process.exit(1);
});
