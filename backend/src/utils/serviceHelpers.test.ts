/**
 * Service helpers — normOneOf, buildUpdates, requireId, requireFound, trim, identity.
 */
import { describe, it, expect } from 'vitest';
import {
  normOneOf,
  buildUpdates,
  requireId,
  requireFound,
  trim,
  identity,
} from './serviceHelpers.js';
import { ValidationError, NotFoundError } from '../errors.js';

describe('serviceHelpers', () => {
  describe('normOneOf', () => {
    const allowed = ['a', 'b', 'c'] as const;

    it('returns value when valid', () => {
      expect(normOneOf('a', allowed)).toBe('a');
      expect(normOneOf('b', allowed)).toBe('b');
    });

    it('returns default when invalid and default provided', () => {
      expect(normOneOf('x', allowed, { default: 'a' })).toBe('a');
      expect(normOneOf(null, allowed, { default: 'b' })).toBe('b');
      expect(normOneOf(undefined, allowed, { default: 'c' })).toBe('c');
    });

    it('throws ValidationError when invalid and errorMessage provided', () => {
      expect(() => normOneOf('x', allowed, { errorMessage: 'Must be a, b, or c' })).toThrow(ValidationError);
      expect(() => normOneOf('x', allowed, { errorMessage: 'Must be a, b, or c' })).toThrow('Must be a, b, or c');
    });

    it('returns value when invalid and neither default nor errorMessage', () => {
      expect(normOneOf('x', allowed)).toBe('x');
      expect(normOneOf(null, allowed)).toBe(null);
    });
  });

  describe('buildUpdates', () => {
    it('builds updates from partial body using rules', () => {
      const body = { name: '  Test  ', age: 25 };
      const rules = {
        name: (v: unknown) => (typeof v === 'string' ? v.trim() : v),
        age: (v: unknown) => Number(v),
      };

      const updates = buildUpdates(body, rules);

      expect(updates).toEqual({ name: 'Test', age: 25 });
    });

    it('only includes keys present in body', () => {
      const body = { name: 'x' };
      const rules = {
        name: identity,
        age: identity,
        email: identity,
      };

      const updates = buildUpdates(body, rules);

      expect(updates).toEqual({ name: 'x' });
    });

    it('throws ValidationError when no fields to update', () => {
      const body = {};
      const rules = { name: identity, age: identity };

      expect(() => buildUpdates(body, rules)).toThrow(ValidationError);
      expect(() => buildUpdates(body, rules)).toThrow('No fields to update');
    });

    it('throws when normalizer throws', () => {
      const body = { age: 'invalid' };
      const rules = {
        age: () => {
          throw new ValidationError('age must be a number');
        },
      };

      expect(() => buildUpdates(body, rules)).toThrow(ValidationError);
      expect(() => buildUpdates(body, rules)).toThrow('age must be a number');
    });

    it('handles null body as empty', () => {
      expect(() => buildUpdates(null, { name: identity })).toThrow('No fields to update');
    });
  });

  describe('requireId', () => {
    it('does not throw when id is truthy', () => {
      expect(() => requireId('id-1')).not.toThrow();
      expect(() => requireId(123)).not.toThrow();
    });

    it('throws ValidationError when id is falsy', () => {
      expect(() => requireId('')).toThrow(ValidationError);
      expect(() => requireId('')).toThrow('id is required');
      expect(() => requireId(null)).toThrow(ValidationError);
      expect(() => requireId(undefined)).toThrow(ValidationError);
    });
  });

  describe('requireFound', () => {
    it('does not throw when value is truthy', () => {
      expect(() => requireFound({ id: 1 }, 'User')).not.toThrow();
    });

    it('throws NotFoundError when value is falsy', () => {
      expect(() => requireFound(null, 'User')).toThrow(NotFoundError);
      expect(() => requireFound(null, 'User')).toThrow('User not found');
      expect(() => requireFound(undefined, 'Transaction')).toThrow('Transaction not found');
    });
  });

  describe('trim', () => {
    it('trims strings', () => {
      expect(trim('  x  ')).toBe('x');
    });

    it('passes through non-strings', () => {
      expect(trim(123)).toBe(123);
      expect(trim(null)).toBe(null);
    });
  });

  describe('identity', () => {
    it('returns value unchanged', () => {
      expect(identity(1)).toBe(1);
      expect(identity('x')).toBe('x');
    });
  });
});
