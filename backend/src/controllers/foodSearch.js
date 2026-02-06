/**
 * Food search controller. No auth required.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import * as foodSearchModel from '../models/foodSearch.js';
import { sendJson } from '../utils/response.js';

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
