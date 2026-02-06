/**
 * Centralized error handler. Maps domain errors to HTTP status codes.
 */
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError } from '../errors.js';

/**
 * Wraps async route handlers to pass errors to next().
 * @param {import('express').RequestHandler} fn
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error middleware. Must be registered after all routes.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: err.message });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message });
  }

  // PostgreSQL unique violation
  if (err?.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  console.error('Unhandled error:', err?.message ?? err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
}
