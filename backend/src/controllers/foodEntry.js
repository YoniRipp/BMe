/**
 * Food entry controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as foodEntryService from '../services/foodEntry.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';
import { getPool } from '../db/pool.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await foodEntryService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  // #region agent log
  let userExists = false;
  try {
    const pool = getPool();
    const r = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    userExists = r.rows.length > 0;
  } catch (_) {}
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'foodEntry.js:add', message: 'before create', data: { userIdPreview: userId != null ? String(userId).slice(0, 8) : null, userIdType: typeof userId, userExists }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {});
  // #endregion
  const item = await foodEntryService.create(userId, req.body);
  sendCreated(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await foodEntryService.update(userId, req.params.id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  await foodEntryService.remove(userId, req.params.id);
  sendNoContent(res);
});
