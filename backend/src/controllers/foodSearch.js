/**
 * Food search controller. No auth required.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import { getPool } from '../db/index.js';
import * as foodSearchModel from '../models/foodSearch.js';
import { lookupAndCreateFood } from '../services/foodLookupGemini.js';
import { sendJson } from '../utils/response.js';
import { sendError } from '../utils/response.js';

export const search = asyncHandler(async (req, res) => {
  if (!config.isDbConfigured) {
    return res.status(503).json({ error: 'Food search is not configured (missing DATABASE_URL)' });
  }
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Math.max(1, parseInt(req.query?.limit, 10) || 10), 25);
  if (!q) {
    return sendJson(res, []);
  }
  const results = await foodSearchModel.search(q, limit);
  sendJson(res, results);
});

export const lookupOrCreate = asyncHandler(async (req, res) => {
  if (!config.isDbConfigured) {
    return sendError(res, 503, 'Food lookup is not configured (missing DATABASE_URL)');
  }
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'Gemini is not configured (missing GEMINI_API_KEY)');
  }
  const { name, liquid } = req.body;
  const pool = getPool();
  const row = await lookupAndCreateFood(pool, name, { liquidHint: liquid });
  if (!row) {
    return sendError(res, 422, 'Could not look up or create food');
  }
  const payload = {
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    referenceGrams: 100,
    isLiquid: row.is_liquid,
    servingSizesMl: row.serving_sizes_ml ?? null,
  };
  sendJson(res, payload);
});
