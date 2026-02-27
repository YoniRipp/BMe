/**
 * Shared helpers for services: id/result guards, normalizers, update builder.
 */
import { ValidationError, NotFoundError } from '../errors.js';

export function requireId(id) {
  if (!id) {
    throw new ValidationError('id is required');
  }
}

export function requireFound(value, resourceName) {
  if (!value) {
    throw new NotFoundError(`${resourceName} not found`);
  }
}

/**
 * Normalize value to one of allowed list. Options: default (when missing/invalid), errorMessage (throw when invalid).
 * @param {*} value
 * @param {readonly string[]} allowedList
 * @param {{ default?: *, errorMessage?: string }} [options]
 * @returns {*}
 */
export function normOneOf(value, allowedList, options = {}) {
  const hasDefault = 'default' in options;
  const hasError = options.errorMessage;
  const valid = value != null && allowedList.includes(value);
  if (valid) return value;
  if (hasError) throw new ValidationError(options.errorMessage);
  if (hasDefault) return options.default;
  return value;
}

/**
 * Build updates object from body using normalizer rules. Only includes keys present in body.
 * Throws ValidationError if no fields to update. Normalizers may throw.
 * @param {object} body
 * @param {Record<string, (value: any) => any>} rules
 * @returns {object}
 */
export function buildUpdates(body, rules) {
  const updates = {};
  const input = body ?? {};
  for (const key of Object.keys(rules)) {
    if (input[key] === undefined) continue;
    updates[key] = rules[key](input[key]);
  }
  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No fields to update');
  }
  return updates;
}

/** Trim string or pass through. For use in buildUpdates. */
export function trim(v) {
  return typeof v === 'string' ? v.trim() : v;
}

/** Identity for buildUpdates when no normalization needed. */
export function identity(v) {
  return v;
}
