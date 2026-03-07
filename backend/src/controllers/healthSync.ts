/**
 * Health sync controller — thin HTTP handlers.
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as healthSyncService from '../services/healthSync.js';
import { sendJson, sendCreated, sendPaginated } from '../utils/response.js';
import { healthMetricsQuerySchema, healthSyncStateUpdateSchema } from '../schemas/routeSchemas.js';

export const sync = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const result = await healthSyncService.sync(userId, req.body);
  sendCreated(res, result);
});

export const getSyncState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const state = await healthSyncService.getSyncState(userId);
  sendJson(res, state);
});

export const updateSyncState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const { platform, dataType, enabled } = healthSyncStateUpdateSchema.parse(req.body);
  const state = await healthSyncService.updateSyncState(userId, platform, dataType, enabled);
  sendJson(res, state);
});

export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const query = healthMetricsQuerySchema.parse(req.query ?? {});
  const { data, total } = await healthSyncService.getMetrics(userId, query);
  sendPaginated(res, data, total, query.limit, query.offset);
});
