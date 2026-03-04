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
import { upsertEmbedding, buildEmbeddingText, deleteEmbedding } from './embeddings.js';

export async function list(userId: string) {
  return scheduleModel.findByUserId(userId);
}

function normDate(v: unknown) {
  if (v == null || v === '') return null;
  const d = new Date(v as string | number | Date);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function create(userId: string, body: Record<string, unknown>) {
  const { title, startTime, endTime, category, emoji, order, isActive, groupId, recurrence, color, date } = body ?? {};
  const cat = normOneOf(category, SCHEDULE_CATEGORIES, { default: 'Other' });
  const rec = normOneOf(recurrence, VALID_RECURRENCE, { default: null });
  const dateStr = normDate(date) ?? new Date().toISOString().slice(0, 10);
  const item = await scheduleModel.create({
    userId,
    title: requireNonEmptyString(title, 'title'),
    startTime: (startTime != null ? String(startTime) : '09:00') as string,
    endTime: (endTime != null ? String(endTime) : '10:00') as string,
    category: cat,
    emoji: emoji as string | undefined,
    order: order != null ? Number(order) : undefined,
    isActive: !!isActive,
    groupId: (typeof groupId === 'string' ? groupId : null) as string | null | undefined,
    recurrence: rec,
    color: color != null && typeof color === 'string' ? color.trim() || null : null,
    date: dateStr,
  });
  await publishEvent('schedule.ScheduleItemAdded', item, userId);
  upsertEmbedding(userId, 'schedule', item.id as string, buildEmbeddingText('schedule', item));
  return item;
}

export async function createBatch(userId: string, items: unknown) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items array is required');
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const normalized = items
    .filter((it: Record<string, unknown>) => it?.title && typeof it.title === 'string' && (it.title as string).trim())
    .map((it: Record<string, unknown>) => ({
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

export async function update(userId: string, id: string, body: Record<string, unknown>) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    date: (v: unknown) => (normDate(v) ?? undefined),
    title: (v: unknown) => (typeof v === 'string' ? v.trim() : v),
    startTime: (v: unknown) => normTimeRequired(v, 'startTime'),
    endTime: (v: unknown) => normTimeRequired(v, 'endTime'),
    category: (v: unknown) => normOneOf(v, SCHEDULE_CATEGORIES, { default: 'Other' }),
    emoji: (v: unknown) => v,
    order: (v: unknown) => Number(v as number),
    isActive: (v: unknown) => !!v,
    groupId: (v: unknown) => v ?? null,
    recurrence: (v: unknown) => normOneOf(v, VALID_RECURRENCE, { default: null }),
    color: (v: unknown) => (v != null && typeof v === 'string' ? v.trim() || null : null),
  });
  const updated = await scheduleModel.update(id, userId, updates);
  requireFound(updated, 'Schedule item');
  await publishEvent('schedule.ScheduleItemUpdated', updated, userId);
  upsertEmbedding(userId, 'schedule', updated.id as string, buildEmbeddingText('schedule', updated));
  return updated;
}

export async function remove(userId: string, id: string) {
  requireId(id);
  const deleted = await scheduleModel.deleteById(id, userId);
  requireFound(deleted, 'Schedule item');
  await publishEvent('schedule.ScheduleItemDeleted', { id }, userId);
  deleteEmbedding(id, 'schedule');
}
