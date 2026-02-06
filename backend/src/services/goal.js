/**
 * Goal service.
 */
import { GOAL_TYPES, GOAL_PERIODS } from '../config/constants.js';
import { validateNonNegative } from '../utils/validation.js';
import { requireId, requireFound, normOneOf, buildUpdates } from '../utils/serviceHelpers.js';
import * as goalModel from '../models/goal.js';

const TYPE_ERROR = 'type must be one of: ' + GOAL_TYPES.join(', ');
const PERIOD_ERROR = 'period must be one of: ' + GOAL_PERIODS.join(', ');

export async function list(userId) {
  return goalModel.findByUserId(userId);
}

export async function create(userId, body) {
  const { type, target, period } = body ?? {};
  normOneOf(type, GOAL_TYPES, { errorMessage: TYPE_ERROR });
  normOneOf(period, GOAL_PERIODS, { errorMessage: PERIOD_ERROR });
  return goalModel.create({
    userId,
    type,
    target: validateNonNegative(target, 'target'),
    period,
  });
}

export async function update(userId, id, body) {
  requireId(id);
  const updates = buildUpdates(body ?? {}, {
    type: (v) => normOneOf(v, GOAL_TYPES, { errorMessage: TYPE_ERROR }),
    period: (v) => normOneOf(v, GOAL_PERIODS, { errorMessage: PERIOD_ERROR }),
    target: (v) => validateNonNegative(v, 'target'),
  });
  const updated = await goalModel.update(id, userId, updates);
  requireFound(updated, 'Goal');
  return updated;
}

export async function remove(userId, id) {
  requireId(id);
  const deleted = await goalModel.deleteById(id, userId);
  requireFound(deleted, 'Goal');
}
