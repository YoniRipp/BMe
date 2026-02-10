/**
 * Centralized error handler. Maps domain errors to HTTP status codes.
 */
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError } from '../errors.js';

const ERROR_STATUS_MAP = [
  [ValidationError, 400],
  [NotFoundError, 404],
  [UnauthorizedError, 401],
  [ConflictError, 409],
];

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

  for (const [ErrorClass, status] of ERROR_STATUS_MAP) {
    if (err instanceof ErrorClass) {
      return res.status(status).json({ error: err.message });
    }
  }

  if (err?.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  console.error('Unhandled error:', err?.message ?? err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
}
