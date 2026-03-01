/**
 * Workout controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as workoutService from '../services/workout.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await workoutService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await workoutService.create(userId, req.body);
  sendCreated(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await workoutService.update(userId, req.params.id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  await workoutService.remove(userId, req.params.id);
  sendNoContent(res);
});
