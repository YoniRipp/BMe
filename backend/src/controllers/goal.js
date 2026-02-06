/**
 * Goal controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as goalService from '../services/goal.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await goalService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await goalService.create(userId, req.body);
  sendCreated(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await goalService.update(userId, req.params.id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  await goalService.remove(userId, req.params.id);
  sendNoContent(res);
});
