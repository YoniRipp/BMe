/**
 * Daily check-in controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as dailyCheckInService from '../services/dailyCheckIn.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await dailyCheckInService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await dailyCheckInService.create(userId, req.body);
  sendCreated(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await dailyCheckInService.update(userId, req.params.id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  await dailyCheckInService.remove(userId, req.params.id);
  sendNoContent(res);
});
