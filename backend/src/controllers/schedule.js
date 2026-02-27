/**
 * Schedule controller — thin HTTP handlers.
 * @module controllers/schedule
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as scheduleService from '../services/schedule.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await scheduleService.list(userId);
  sendJson(res, items);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await scheduleService.create(userId, req.body);
  sendCreated(res, item);
});

export const addBatch = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const items = await scheduleService.createBatch(userId, req.body?.items);
  sendCreated(res, items);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const { id } = req.params;
  const item = await scheduleService.update(userId, id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const { id } = req.params;
  await scheduleService.remove(userId, id);
  sendNoContent(res);
});
