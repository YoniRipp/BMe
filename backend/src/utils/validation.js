/**
 * Validation and normalization helpers.
 */

/**
 * Normalize time string to HH:MM 24h format.
 * @param {string} s
 * @returns {string|undefined}
 */
export function normTime(s) {
  return s && /^\d{1,2}:\d{2}$/.test(s) ? s : undefined;
}

/**
 * Normalize time or throw. For use in updates.
 * @param {string} s
 * @param {string} [fieldName='Time']
 * @returns {string}
 */
export function normTimeRequired(s, fieldName = 'Time') {
  const t = normTime(s);
  if (t === undefined) {
    throw new ValidationError(`Invalid ${fieldName}; use HH:MM format`);
  }
  return t;
}

/**
 * Normalize category to one of allowed list, default 'Other'.
 * @param {string} cat
 * @param {readonly string[]} list
 * @returns {string}
 */
export function normCat(cat, list) {
  return cat && list.includes(cat) ? cat : 'Other';
}

/**
 * Parse date to YYYY-MM-DD string. Only accepts valid calendar dates; defaults to today when omitted.
 * @param {string|Date|undefined} d
 * @returns {string}
 */
export function parseDate(d) {
  const str = d == null ? '' : String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d_] = str.split('-').map(Number);
    const month = m - 1;
    const date = new Date(y, month, d_);
    if (date.getFullYear() !== y || date.getMonth() !== month || date.getDate() !== d_) {
      return new Date().toISOString().slice(0, 10);
    }
    return str;
  }
  const date = str ? new Date(d) : new Date();
  if (!Number.isFinite(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

import { ValidationError } from '../errors.js';

/**
 * Validate non-negative number. Throws ValidationError if invalid.
 * @param {number} n
 * @param {string} field
 * @returns {number}
 */
export function validateNonNegative(n, field) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) {
    throw new ValidationError(`${field} must be a non-negative number`);
  }
  return num;
}

/**
 * Require a non-empty string (after trim). Throws ValidationError if invalid.
 * @param {*} value
 * @param {string} fieldName
 * @returns {string}
 */
export function requireNonEmptyString(value, fieldName) {
  const s = value != null && typeof value === 'string' ? value.trim() : '';
  if (!s) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return s;
}

/**
 * Require a positive number (>= 1). Throws ValidationError if invalid.
 * @param {*} value
 * @param {string} fieldName
 * @returns {number}
 */
export function requirePositiveNumber(value, fieldName) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
  return num;
}
