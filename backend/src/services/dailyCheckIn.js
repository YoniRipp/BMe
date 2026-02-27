/**
 * Daily check-in service.
 */
import { parseDate, validateNonNegative } from '../utils/validation.js';
import { requireId, requireFound, buildUpdates } from '../utils/serviceHelpers.js';
import * as dailyCheckInModel from '../models/dailyCheckIn.js';
import { publishEvent } from '../events/publish.js';

function normSleepHours(v) {
  if (v == null) return null;
  return validateNonNegative(v, 'sleepHours');
}

export async function list(userId) {
  return dailyCheckInModel.findByUserId(userId);
}

export async function create(userId, body) {
  const { date, sleepHours } = body ?? {};
  const checkIn = await dailyCheckInModel.create({
    userId,
    date: parseDate(date),
    sleepHours: normSleepHours(sleepHours),
  });
  await publishEvent('energy.CheckInCreated', checkIn, userId);
  return checkIn;
}

export async function update(userId, id, body) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    date: (v) => v,
    sleepHours: normSleepHours,
  });
  const updated = await dailyCheckInModel.update(id, userId, updates);
  requireFound(updated, 'Daily check-in');
  await publishEvent('energy.CheckInUpdated', updated, userId);
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await dailyCheckInModel.deleteById(id, userId);
  requireFound(deleted, 'Daily check-in');
}
