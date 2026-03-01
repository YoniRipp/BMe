/**
 * Transaction controller.
 */
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as transactionService from '../services/transaction.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const result = await transactionService.list(userId, req.query);
  sendJson(res, result);
});

export const add = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await transactionService.create(userId, req.body);
  sendCreated(res, item);
});

export const update = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const item = await transactionService.update(userId, req.params.id, req.body);
  sendJson(res, item);
});

export const remove = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  await transactionService.remove(userId, req.params.id);
  sendNoContent(res);
});

export const balance = asyncHandler(async (req, res) => {
  const userId = getEffectiveUserId(req);
  const result = await transactionService.getBalance(userId, req.query.month);
  sendJson(res, result);
});
