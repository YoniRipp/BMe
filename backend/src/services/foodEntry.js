/**
 * Food entry service.
 */
import { parseDate, validateNonNegative, requireNonEmptyString, normTime } from '../utils/validation.js';
import { requireId, requireFound, buildUpdates } from '../utils/serviceHelpers.js';
import * as foodEntryModel from '../models/foodEntry.js';
import { publishEvent } from '../events/publish.js';
import { upsertEmbedding, buildEmbeddingText, deleteEmbedding } from './embeddings.js';

export async function list(userId) {
  return foodEntryModel.findByUserId(userId);
}

function optionalTime(v) {
  if (v == null || typeof v !== 'string') return undefined;
  return normTime(v.trim()) || undefined;
}

export async function create(userId, body) {
  const { date, name, calories, protein, carbs, fats, portionAmount, portionUnit, servingType, startTime, endTime } = body ?? {};
  const entry = await foodEntryModel.create({
    userId,
    date: parseDate(date),
    name: requireNonEmptyString(name, 'name'),
    calories: validateNonNegative(calories ?? 0, 'calories'),
    protein: validateNonNegative(protein ?? 0, 'protein'),
    carbs: validateNonNegative(carbs ?? 0, 'carbs'),
    fats: validateNonNegative(fats ?? 0, 'fats'),
    portionAmount: portionAmount != null ? validateNonNegative(portionAmount, 'portionAmount') : undefined,
    portionUnit: portionUnit != null && typeof portionUnit === 'string' ? portionUnit.trim() || undefined : undefined,
    servingType: servingType != null && typeof servingType === 'string' ? servingType.trim() || undefined : undefined,
    startTime: optionalTime(startTime),
    endTime: optionalTime(endTime),
  });
  await publishEvent('energy.FoodEntryCreated', entry, userId);
  upsertEmbedding(userId, 'food_entry', entry.id, buildEmbeddingText('food_entry', entry));
  return entry;
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
    portionAmount: (v) => (v != null ? validateNonNegative(v, 'portionAmount') : undefined),
    portionUnit: (v) => (v != null && typeof v === 'string' ? v.trim() || undefined : undefined),
    servingType: (v) => (v != null && typeof v === 'string' ? v.trim() || undefined : undefined),
    startTime: (v) => optionalTime(v),
    endTime: (v) => optionalTime(v),
  });
  const updated = await foodEntryModel.update(id, userId, updates);
  requireFound(updated, 'Food entry');
  await publishEvent('energy.FoodEntryUpdated', updated, userId);
  upsertEmbedding(userId, 'food_entry', updated.id, buildEmbeddingText('food_entry', updated));
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await foodEntryModel.deleteById(id, userId);
  requireFound(deleted, 'Food entry');
  await publishEvent('energy.FoodEntryDeleted', { id }, userId);
  deleteEmbedding(id, 'food_entry');
}
