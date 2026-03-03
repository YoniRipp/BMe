/**
 * Food search controller. No auth required.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import { getPool } from '../db/index.js';
import { getRedisClient } from '../redis/client.js';
import * as foodSearchModel from '../models/foodSearch.js';
import { lookupAndCreateFood } from '../services/foodLookupGemini.js';
import { sendJson } from '../utils/response.js';
import { sendError } from '../utils/response.js';

const FOOD_SEARCH_CACHE_TTL_SEC = 3600;

export const search = asyncHandler(async (req, res) => {
  if (!config.isDbConfigured) {
    return res.status(503).json({ error: 'Food search is not configured (missing DATABASE_URL)' });
  }
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Math.max(1, parseInt(req.query?.limit, 10) || 10), 25);
  if (!q) {
    return sendJson(res, []);
  }

  if (config.isRedisConfigured) {
    const redis = await getRedisClient();
    const cacheKey = `food:search:${encodeURIComponent(q)}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendJson(res, JSON.parse(cached));
    }
  }

  const results = await foodSearchModel.search(q, limit);

  if (config.isRedisConfigured) {
    const redis = await getRedisClient();
    const cacheKey = `food:search:${encodeURIComponent(q)}:${limit}`;
    await redis.setEx(cacheKey, FOOD_SEARCH_CACHE_TTL_SEC, JSON.stringify(results));
  }

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

const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v2/product';

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_en?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  quantity?: string;
}

export const barcodeLookup = asyncHandler(async (req, res) => {
  const code = typeof req.params?.code === 'string' ? req.params.code.trim() : '';
  if (!code || !/^\d{8,14}$/.test(code)) {
    return sendError(res, 400, 'Invalid barcode (expect 8–14 digits)');
  }

  const url = `${OPEN_FOOD_FACTS_BASE}/${encodeURIComponent(code)}.json`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    return sendError(res, 404, 'Product not found for this barcode');
  }

  const p: OpenFoodFactsProduct = data.product;
  const name =
    p.product_name_en ?? p.product_name ?? 'Unknown product';
  const nut = p.nutriments ?? {};
  const calories = Math.round(nut['energy-kcal_100g'] ?? 0);
  const protein = Math.round((nut.proteins_100g ?? 0) * 10) / 10;
  const carbs = Math.round((nut.carbohydrates_100g ?? 0) * 10) / 10;
  const fat = Math.round((nut.fat_100g ?? 0) * 10) / 10;

  const payload = {
    name: String(name).trim() || 'Unknown product',
    calories: Math.max(0, calories),
    protein: Math.max(0, protein),
    carbs: Math.max(0, carbs),
    fat: Math.max(0, fat),
    referenceGrams: 100,
    isLiquid: false,
    servingSizesMl: null,
  };

  sendJson(res, payload);
});
