/**
 * Group controller — HTTP handlers.
 * @module controllers/group
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getEffectiveUserId } from '../middleware/auth.js';
import * as groupService from '../services/group.js';
import { sendJson, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../errors.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const groups = await groupService.list(userId);
  sendJson(res, groups);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const group = await groupService.get(id, userId);
  if (!group) throw new NotFoundError('Group not found');
  sendJson(res, group);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const group = await groupService.create(userId, req.body);
  sendCreated(res, group);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const group = await groupService.update(id, userId, req.body);
  sendJson(res, group);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  await groupService.remove(id, userId);
  sendNoContent(res);
});

export const invite = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const email = req.body?.email;
  const group = await groupService.addInvitation(id, userId, email);
  sendJson(res, group);
});

export const cancelInvite = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const email = req.body?.email ?? (req.query?.email as string);
  const group = await groupService.cancelInvitation(id, userId, email);
  sendJson(res, group);
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const userEmail = req.user?.email;
  const group = await groupService.acceptInvitation(id, userId, userEmail as string);
  sendJson(res, group);
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const id = req.params.id as string;
  const targetUserId = req.params.userId as string;
  await groupService.removeMember(id, userId, targetUserId);
  sendNoContent(res);
});

/** Public: resolve invite token for join page. No auth. */
export const getInvitationByToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const invitation = await groupService.getInvitationByToken(token);
  if (!invitation) throw new NotFoundError('Invitation not found or expired');
  sendJson(res, invitation);
});

/** Authenticated: accept invite by token (from email link). */
export const acceptInviteByToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = getEffectiveUserId(req);
  const token = req.body?.token;
  if (!token) throw new ValidationError('token is required');
  const userEmail = req.user?.email as string;
  const group = await groupService.acceptInviteByToken(token, userId, userEmail);
  sendJson(res, group);
});
