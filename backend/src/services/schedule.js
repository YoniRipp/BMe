/**
 * Schedule service — validation and business logic.
 * @module services/schedule
 */
import { ValidationError } from '../errors.js';
import { SCHEDULE_CATEGORIES, VALID_RECURRENCE } from '../config/constants.js';
import { normTime, normTimeRequired } from '../utils/validation.js';
import { requireNonEmptyString } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates, trim } from '../utils/serviceHelpers.js';
import * as scheduleModel from '../models/schedule.js';
import { publishEvent } from '../events/publish.js';

export async function list(userId) {
  return scheduleModel.findByUserId(userId);
}

function normDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function create(userId, body) {
  const { title, startTime, endTime, category, emoji, order, isActive, groupId, recurrence, color, date } = body ?? {};
  const cat = normOneOf(category, SCHEDULE_CATEGORIES, { default: 'Other' });
  const rec = normOneOf(recurrence, VALID_RECURRENCE, { default: null });
  const dateStr = normDate(date) ?? new Date().toISOString().slice(0, 10);
  const item = await scheduleModel.create({
    userId,
    title: requireNonEmptyString(title, 'title'),
    startTime: startTime ?? '09:00',
    endTime: endTime ?? '10:00',
    category: cat,
    emoji,
    order,
    isActive,
    groupId,
    recurrence: rec,
    color: color != null && typeof color === 'string' ? color.trim() || null : null,
    date: dateStr,
  });
  await publishEvent('schedule.ScheduleItemAdded', item, userId);
  return item;
}

export async function createBatch(userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items array is required');
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const normalized = items
    .filter((it) => it?.title && typeof it.title === 'string' && it.title.trim())
    .map((it) => ({
      ...it,
      title: String(it.title).trim(),
      category: normOneOf(it?.category, SCHEDULE_CATEGORIES, { default: 'Other' }),
      recurrence: normOneOf(it?.recurrence, VALID_RECURRENCE, { default: null }),
      date: normDate(it?.date) ?? todayStr,
    }));
  if (normalized.length === 0) {
    throw new ValidationError('At least one valid item with title is required');
  }
  const created = await scheduleModel.createBatch(userId, normalized);
  await publishEvent('schedule.ScheduleBatchAdded', { items: created }, userId);
  return created;
}

export async function update(userId, id, body) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    date: (v) => (normDate(v) ?? undefined),
    title: (v) => (typeof v === 'string' ? v.trim() : v),
    startTime: (v) => normTimeRequired(v, 'startTime'),
    endTime: (v) => normTimeRequired(v, 'endTime'),
    category: (v) => normOneOf(v, SCHEDULE_CATEGORIES, { default: 'Other' }),
    emoji: (v) => v,
    order: (v) => Number(v),
    isActive: (v) => !!v,
    groupId: (v) => v ?? null,
    recurrence: (v) => normOneOf(v, VALID_RECURRENCE, { default: null }),
    color: (v) => (v != null && typeof v === 'string' ? v.trim() || null : null),
  });
  const updated = await scheduleModel.update(id, userId, updates);
  requireFound(updated, 'Schedule item');
  await publishEvent('schedule.ScheduleItemUpdated', updated, userId);
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await scheduleModel.deleteById(id, userId);
  requireFound(deleted, 'Schedule item');
  await publishEvent('schedule.ScheduleItemDeleted', { id }, userId);
}
