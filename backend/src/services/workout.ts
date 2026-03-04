/**
 * Workout service.
 */
import { ValidationError } from '../errors.js';
import { WORKOUT_TYPES } from '../config/constants.js';
import { parseDate, requirePositiveNumber } from '../utils/validation.js';
import { requireNonEmptyString } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates, trim, identity } from '../utils/serviceHelpers.js';
import * as workoutModel from '../models/workout.js';
import { publishEvent } from '../events/publish.js';
import { upsertEmbedding, buildEmbeddingText, deleteEmbedding } from './embeddings.js';

const TYPE_ERROR = 'type must be one of: ' + WORKOUT_TYPES.join(', ');

export async function list(userId: string) {
  return workoutModel.findByUserId(userId);
}

export async function create(userId: string, body: Record<string, unknown>) {
  const { date, title, type, durationMinutes, exercises, notes } = body ?? {};
  const validType = normOneOf(type, WORKOUT_TYPES, { errorMessage: TYPE_ERROR });
  const workout = await workoutModel.create({
    userId,
    date: parseDate(date),
    title: requireNonEmptyString(title, 'title'),
    type: String(validType),
    durationMinutes: requirePositiveNumber(durationMinutes, 'durationMinutes'),
    exercises,
    notes,
  });
  await publishEvent('body.WorkoutCreated', workout, userId);
  upsertEmbedding(userId, 'workout', String(workout.id), buildEmbeddingText('workout', workout));
  return workout;
}

export async function update(userId: string, id: string, body: Record<string, unknown>) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    date: (v: unknown) => parseDate(v),
    title: trim,
    type: (v: unknown) => normOneOf(v, WORKOUT_TYPES, { errorMessage: TYPE_ERROR }),
    durationMinutes: (v: unknown) => requirePositiveNumber(v, 'durationMinutes'),
    exercises: identity,
    notes: identity,
  });
  const updated = await workoutModel.update(id, userId, updates);
  requireFound(updated, 'Workout');
  await publishEvent('body.WorkoutUpdated', updated, userId);
  upsertEmbedding(userId, 'workout', updated.id as string, buildEmbeddingText('workout', updated));
  return updated;
}

export async function remove(userId: string, id: string) {
  requireId(id);
  const deleted = await workoutModel.deleteById(id, userId);
  requireFound(deleted, 'Workout');
  await publishEvent('body.WorkoutDeleted', { id }, userId);
  deleteEmbedding(id, 'workout');
}
