/**
 * Semantic search controller.
 * POST /api/search — natural language search over the user's data using vector embeddings.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendJson, sendError } from '../utils/response.js';
import { semanticSearch } from '../services/embeddings.js';
import { config } from '../config/index.js';

const ALLOWED_TYPES = ['transaction', 'workout', 'food_entry', 'schedule'];

export const search = asyncHandler(async (req, res) => {
  if (!config.geminiApiKey) {
    return sendError(res, 503, 'Semantic search not configured (missing GEMINI_API_KEY)');
  }

  const { q, types, limit } = req.body ?? {};

  if (!q || typeof q !== 'string' || !q.trim()) {
    return sendError(res, 400, 'Query parameter "q" is required');
  }

  const query = q.trim().slice(0, 500);

  const filterTypes = Array.isArray(types)
    ? types.filter((t) => ALLOWED_TYPES.includes(t))
    : [];

  const maxLimit = Math.min(Number.isFinite(Number(limit)) ? Number(limit) : 10, 50);

  const userId = req.user.id;

  const results = await semanticSearch(userId, query, {
    types: filterTypes,
    limit: maxLimit,
  });

  return sendJson(res, { query, results, total: results.length });
});
