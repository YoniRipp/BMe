/**
 * Group service — validation and business logic.
 * @module services/group
 */
import { ValidationError } from '../errors.js';
import * as groupModel from '../models/group.js';
import { config } from '../config/index.js';
import { sendAddedToGroupEmail, sendGroupInviteEmail } from '../lib/email.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireNonEmptyString(val, field) {
  if (val == null || typeof val !== 'string' || !val.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  return val.trim();
}

export async function list(userId) {
  return groupModel.findByUserId(userId);
}

export async function get(id, userId) {
  const group = await groupModel.findById(id, userId);
  if (!group) return null;
  return group;
}

export async function create(userId, body) {
  const name = requireNonEmptyString(body?.name, 'name');
  const type = requireNonEmptyString(body?.type ?? 'other', 'type');
  const description = body?.description != null ? String(body.description).trim() || undefined : undefined;
  return groupModel.create({
    name,
    description,
    type,
    createdByUserId: userId,
  });
}

export async function update(id, userId, body) {
  const updates = {};
  if (body?.name !== undefined) updates.name = requireNonEmptyString(body.name, 'name');
  if (body?.description !== undefined) updates.description = body.description == null ? '' : String(body.description).trim();
  if (body?.type !== undefined) updates.type = requireNonEmptyString(body.type, 'type');
  return groupModel.update(id, userId, updates);
}

export async function remove(id, userId) {
  await groupModel.remove(id, userId);
}

export async function addInvitation(groupId, userId, email) {
  const trimmed = email != null ? String(email).trim() : '';
  if (!trimmed) throw new ValidationError('email is required');
  if (!EMAIL_REGEX.test(trimmed)) throw new ValidationError('Invalid email format');
  const { group, invitationId } = await groupModel.addInvitation(groupId, userId, trimmed);
  if (invitationId) {
    const baseUrl = (config.appBaseUrl || '').replace(/\/$/, '');
    const inviteLink = `${baseUrl}/invite/join?token=${invitationId}`;
    sendGroupInviteEmail(trimmed, group.name, inviteLink).catch((err) =>
      console.error('Failed to send group invite email:', err?.message ?? err)
    );
  }
  return group;
}

export async function cancelInvitation(groupId, userId, email) {
  const trimmed = email != null ? String(email).trim() : '';
  if (!trimmed) throw new ValidationError('email is required');
  return groupModel.cancelInvitation(groupId, userId, trimmed);
}

export async function acceptInvitation(groupId, userId, userEmail) {
  const group = await groupModel.acceptInvitation(groupId, userId, userEmail);
  const emailNorm = (userEmail || '').trim().toLowerCase();
  sendAddedToGroupEmail(emailNorm, group.name, group.id).catch((err) =>
    console.error('Failed to send added-to-group email:', err?.message ?? err)
  );
  return group;
}

export async function removeMember(groupId, userId, targetUserId) {
  return groupModel.removeMember(groupId, userId, targetUserId);
}

export async function getInvitationByToken(token) {
  return groupModel.findInvitationByToken(token);
}

export async function acceptInviteByToken(token, userId, userEmail) {
  const group = await groupModel.acceptInvitationByToken(token, userId, userEmail);
  const emailNorm = (userEmail || '').trim().toLowerCase();
  sendAddedToGroupEmail(emailNorm, group.name, group.id).catch((err) =>
    console.error('Failed to send added-to-group email:', err?.message ?? err)
  );
  return group;
}
