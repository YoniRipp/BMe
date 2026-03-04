/**
 * Goal service.
 */
import { GOAL_TYPES, GOAL_PERIODS } from '../config/constants.js';
import { validateNonNegative } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates } from '../utils/serviceHelpers.js';
import * as goalModel from '../models/goal.js';
import { publishEvent } from '../events/publish.js';

const TYPE_ERROR = 'type must be one of: ' + GOAL_TYPES.join(', ');
const PERIOD_ERROR = 'period must be one of: ' + GOAL_PERIODS.join(', ');

export async function list(userId: string) {
  return goalModel.findByUserId(userId);
}

export async function create(userId: string, body: Record<string, unknown>) {
  const { type, target, period } = body ?? {};
  const t = normOneOf(type, GOAL_TYPES, { errorMessage: TYPE_ERROR }) as string;
  const p = normOneOf(period, GOAL_PERIODS, { errorMessage: PERIOD_ERROR }) as string;
  const goal = await goalModel.create({
    userId,
    type: t,
    target: validateNonNegative(target, 'target'),
    period: p,
  });
  await publishEvent('goals.GoalCreated', goal, userId);
  return goal;
}

export async function update(userId: string, id: string, body: Record<string, unknown>) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    type: (v: unknown) => normOneOf(v, GOAL_TYPES, { errorMessage: TYPE_ERROR }),
    period: (v: unknown) => normOneOf(v, GOAL_PERIODS, { errorMessage: PERIOD_ERROR }),
    target: (v: unknown) => validateNonNegative(v, 'target'),
  });
  const updated = await goalModel.update(id, userId, updates);
  requireFound(updated, 'Goal');
  await publishEvent('goals.GoalUpdated', updated, userId);
  return updated;
}

export async function remove(userId: string, id: string) {
  requireId(id);
  const deleted = await goalModel.deleteById(id, userId);
  requireFound(deleted, 'Goal');
  await publishEvent('goals.GoalDeleted', { id }, userId);
}
