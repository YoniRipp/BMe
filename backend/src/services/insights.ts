/**
 * AI Insights service — uses Gemini to generate personalized insights and recommendations
 * based on the user's actual data (transactions, workouts, food entries, sleep).
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';
import { logger } from '../lib/logger.js';

function getGemini() {
  if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({
    model: config.geminiModel,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

/** Fetch a summary of the user's recent data from the DB for the past N days. */
async function fetchUserContext(userId, days = 30) {
  const pool = getPool();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const [txResult, workoutResult, foodResult, sleepResult] = await Promise.all([
    pool.query(
      `SELECT type, SUM(amount) AS total, category, COUNT(*)::int AS count
       FROM transactions WHERE user_id = $1 AND date >= $2
       GROUP BY type, category ORDER BY total DESC`,
      [userId, sinceStr]
    ),
    pool.query(
      `SELECT type, COUNT(*)::int AS count, AVG(duration_minutes)::numeric AS avg_duration
       FROM workouts WHERE user_id = $1 AND date >= $2
       GROUP BY type`,
      [userId, sinceStr]
    ),
    pool.query(
      `SELECT SUM(calories)::numeric AS total_calories, AVG(calories)::numeric AS avg_daily_cal,
              SUM(protein)::numeric AS total_protein, COUNT(DISTINCT date)::int AS days_tracked
       FROM food_entries WHERE user_id = $1 AND date >= $2`,
      [userId, sinceStr]
    ),
    pool.query(
      `SELECT AVG(sleep_hours)::numeric AS avg_sleep, COUNT(*)::int AS days_logged
       FROM daily_check_ins WHERE user_id = $1 AND date >= $2 AND sleep_hours IS NOT NULL`,
      [userId, sinceStr]
    ),
  ]);

  return {
    transactions: txResult.rows,
    workouts: workoutResult.rows,
    food: foodResult.rows[0] ?? {},
    sleep: sleepResult.rows[0] ?? {},
    periodDays: days,
  };
}

const CACHE_FRESH_HOURS = 24;

/** Get the most recent cached insight for a user. */
export async function getLastInsight(userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT summary, highlights, suggestions, score, today_workout, today_budget, today_nutrition, today_focus, created_at
     FROM ai_insights
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

/** Save generated insight to DB. */
export async function saveInsight(userId, data) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO ai_insights (user_id, summary, highlights, suggestions, score, today_workout, today_budget, today_nutrition, today_focus)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9)`,
    [
      userId,
      data.summary ?? '',
      JSON.stringify(data.highlights ?? []),
      JSON.stringify(data.suggestions ?? []),
      data.score ?? 0,
      data.today_workout ?? '',
      data.today_budget ?? '',
      data.today_nutrition ?? '',
      data.today_focus ?? '',
    ]
  );
}

/** Check if a cached insight is still fresh (within CACHE_FRESH_HOURS). */
export function isCacheFresh(row) {
  if (!row?.created_at) return false;
  const createdAt = new Date(row.created_at);
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - CACHE_FRESH_HOURS);
  return createdAt >= cutoff;
}

/**
 * Get insights from cache if fresh, else generate and save.
 * @param {string} userId
 * @returns {Promise<{ main: object, today: object, cached: boolean }>}
 */
export async function getOrGenerateInsights(userId) {
  const cached = await getLastInsight(userId);
  if (cached && isCacheFresh(cached)) {
    return {
      main: {
        summary: cached.summary,
        highlights: cached.highlights ?? [],
        suggestions: cached.suggestions ?? [],
        score: Number(cached.score) ?? 0,
      },
      today: {
        workout: cached.today_workout ?? '',
        budget: cached.today_budget ?? '',
        nutrition: cached.today_nutrition ?? '',
        focus: cached.today_focus ?? '',
      },
      cached: true,
    };
  }
  const result = await generateInsights(userId);
  const main = {
    summary: result.summary,
    highlights: result.highlights ?? [],
    suggestions: result.suggestions ?? [],
    score: result.score ?? 0,
  };
  const today = result.today ?? { workout: '', budget: '', nutrition: '', focus: '' };
  return { main, today, cached: false };
}

/**
 * Force regenerate insights, ignoring cache. Used by Refresh button.
 * @param {string} userId
 * @returns {Promise<{ main: object, today: object }>}
 */
export async function refreshInsights(userId) {
  const result = await generateInsights(userId);
  const main = {
    summary: result.summary,
    highlights: result.highlights ?? [],
    suggestions: result.suggestions ?? [],
    score: result.score ?? 0,
  };
  const today = result.today ?? { workout: '', budget: '', nutrition: '', focus: '' };
  return { main, today };
}

/**
 * Generate AI-powered weekly insights and today's recommendations for a user.
 * Saves both to ai_insights. Returns main insights.
 * @param {string} userId
 * @returns {Promise<{ summary: string, highlights: string[], suggestions: string[], score: number, today?: object }>}
 */
export async function generateInsights(userId) {
  const ctx = await fetchUserContext(userId, 30);
  const model = getGemini();

  const totalExpenses = ctx.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.total), 0);
  const totalIncome = ctx.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.total), 0);
  const totalWorkouts = ctx.workouts.reduce((s, w) => s + w.count, 0);

  const prompt = `You are a personal life coach assistant. Analyze this user's last 30 days of data and return a JSON object.

Data summary:
- Finances: Total income $${totalIncome.toFixed(2)}, Total expenses $${totalExpenses.toFixed(2)}, Net $${(totalIncome - totalExpenses).toFixed(2)}
- Spending by category: ${ctx.transactions.filter((t) => t.type === 'expense').map((t) => `${t.category}: $${Number(t.total).toFixed(2)}`).join(', ') || 'no data'}
- Workouts: ${totalWorkouts} workouts across ${ctx.workouts.map((w) => `${w.count} ${w.type}`).join(', ') || 'no data'}
- Nutrition: avg ${Math.round(Number(ctx.food.avg_daily_cal) || 0)} kcal/day over ${ctx.food.days_tracked || 0} tracked days, total protein ${Math.round(Number(ctx.food.total_protein) || 0)}g
- Sleep: avg ${Number(ctx.sleep.avg_sleep || 0).toFixed(1)} hours/night over ${ctx.sleep.days_logged || 0} logged nights

Return exactly this JSON structure (no markdown, raw JSON only):
{
  "summary": "2-3 sentence plain-English summary of this month",
  "highlights": ["3-5 positive bullet points (short, specific, data-driven)"],
  "suggestions": ["3-5 actionable improvement suggestions (short, specific)"],
  "score": <integer 0-100 representing overall wellness/life management score>
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    const mainInsights = {
      summary: String(parsed.summary ?? ''),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
      score: Number.isFinite(Number(parsed.score)) ? Math.min(100, Math.max(0, Math.round(Number(parsed.score)))) : 50,
    };
    let todayRecs = { workout: '', budget: '', nutrition: '', focus: '' };
    try {
      todayRecs = await generateTodayRecommendations(userId);
    } catch (recErr) {
      logger.warn({ err: recErr }, 'Today recommendations generation failed, saving main insights only');
    }
    await saveInsight(userId, { ...mainInsights, ...todayRecs });
    return { ...mainInsights, today: todayRecs };
  } catch (err) {
    logger.error({ err }, 'AI insights generation failed');
    return {
      summary: 'Unable to generate insights at this time.',
      highlights: [],
      suggestions: [],
      score: 0,
      today: { workout: '', budget: '', nutrition: '', focus: '' },
    };
  }
}

/**
 * Generate personalized recommendations for today.
 * @param {string} userId
 * @returns {Promise<{ workout: string, budget: string, nutrition: string, focus: string }>}
 */
export async function generateTodayRecommendations(userId) {
  const ctx = await fetchUserContext(userId, 14);
  const model = getGemini();

  const recentWorkouts = ctx.workouts.reduce((s, w) => s + w.count, 0);
  const avgSleep = Number(ctx.sleep.avg_sleep || 0).toFixed(1);
  const avgCal = Math.round(Number(ctx.food.avg_daily_cal) || 0);
  const totalExpenses = ctx.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.total), 0);
  const totalIncome = ctx.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.total), 0);

  const prompt = `You are a friendly personal assistant. Based on this user's last 14 days, give them personalized recommendations for today.

Recent data:
- ${recentWorkouts} workouts in last 14 days (${ctx.workouts.map((w) => `${w.count} ${w.type}`).join(', ') || 'none'})
- Average sleep: ${avgSleep} hours/night
- Average daily calories: ${avgCal} kcal
- Income: $${totalIncome.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)} this period

Return exactly this JSON (no markdown, raw JSON):
{
  "workout": "One specific workout recommendation for today (1-2 sentences)",
  "budget": "One specific budget/spending tip for today (1-2 sentences)",
  "nutrition": "One specific nutrition recommendation for today (1-2 sentences)",
  "focus": "One overall focus/mindset tip for today (1-2 sentences)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    return {
      workout: String(parsed.workout ?? ''),
      budget: String(parsed.budget ?? ''),
      nutrition: String(parsed.nutrition ?? ''),
      focus: String(parsed.focus ?? ''),
    };
  } catch (err) {
    logger.error({ err }, 'AI recommendations generation failed');
    return {
      workout: '',
      budget: '',
      nutrition: '',
      focus: '',
    };
  }
}
