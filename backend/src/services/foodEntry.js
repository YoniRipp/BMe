/**
 * Food entry service.
 */
import { parseDate, validateNonNegative, requireNonEmptyString } from '../utils/validation.js';
import { requireId, requireFound, buildUpdates } from '../utils/serviceHelpers.js';
import * as foodEntryModel from '../models/foodEntry.js';

export async function list(userId) {
  return foodEntryModel.findByUserId(userId);
}

export async function create(userId, body) {
  const { date, name, calories, protein, carbs, fats } = body ?? {};
  return foodEntryModel.create({
    userId,
    date: parseDate(date),
    name: requireNonEmptyString(name, 'name'),
    calories: validateNonNegative(calories ?? 0, 'calories'),
    protein: validateNonNegative(protein ?? 0, 'protein'),
    carbs: validateNonNegative(carbs ?? 0, 'carbs'),
    fats: validateNonNegative(fats ?? 0, 'fats'),
  });
}

export async function update(userId, id, body) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    date: (v) => v,
    name: (v) => v,
    calories: (v) => validateNonNegative(v, 'calories'),
    protein: (v) => validateNonNegative(v, 'protein'),
    carbs: (v) => validateNonNegative(v, 'carbs'),
    fats: (v) => validateNonNegative(v, 'fats'),
  });
  const updated = await foodEntryModel.update(id, userId, updates);
  requireFound(updated, 'Food entry');
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await foodEntryModel.deleteById(id, userId);
  requireFound(deleted, 'Food entry');
}
