/**
 * AI Insights controller.
 * GET /api/insights          — monthly AI-generated insights + wellness score
 * GET /api/insights/today    — personalized recommendations for today
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendJson, sendError } from '../utils/response.js';
import { generateInsights, generateTodayRecommendations } from '../services/insights.js';
import { getPool } from '../db/pool.js';
import { config } from '../config/index.js';

export const getInsights = asyncHandler(async (req, res) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'AI insights not configured (missing GEMINI_API_KEY)');
  }
  const insights = await generateInsights(req.user.id);
  return sendJson(res, insights);
});

/** GET /api/insights/stats?days=30 — aggregated daily stats from the read-model pipeline */
export const getStats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(1, parseInt(req.query.days, 10) || 30), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const pool = getPool();
  const result = await pool.query(
    `SELECT date, total_calories, total_income, total_expenses, workout_count, sleep_hours
     FROM user_daily_stats
     WHERE user_id = $1 AND date >= $2
     ORDER BY date ASC`,
    [req.user.id, since.toISOString().slice(0, 10)]
  );
  return sendJson(res, { days, stats: result.rows });
});

export const getTodayRecommendations = asyncHandler(async (req, res) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'AI insights not configured (missing GEMINI_API_KEY)');
  }
  const recs = await generateTodayRecommendations(req.user.id);
  return sendJson(res, recs);
});
