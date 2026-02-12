/**
 * Food entry controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as foodEntryService from '../services/foodEntry.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await foodEntryService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
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
