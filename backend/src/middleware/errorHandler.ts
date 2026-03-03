/**
 * Centralized error handler. Maps domain errors to HTTP status codes.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../errors.js';
import { logger } from '../lib/logger.js';

const ERROR_STATUS_MAP: [new (...args: string[]) => Error, number][] = [
  [ValidationError, 400],
  [NotFoundError, 404],
  [UnauthorizedError, 401],
  [ConflictError, 409],
  [ForbiddenError, 403],
];

/**
 * Wraps async route handlers to pass errors to next().
 * @param {RequestHandler} fn
 * @returns {RequestHandler}
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error middleware. Must be registered after all routes.
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function errorHandler(err: Error & { code?: string; constraint?: string }, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  for (const [ErrorClass, status] of ERROR_STATUS_MAP) {
    if (err instanceof ErrorClass) {
      return res.status(status).json({ error: err.message });
    }
  }

  if (err?.code === '23505') {
    const constraint = err?.constraint ?? '';
    const msg = constraint.includes('email') ? 'Email already registered' : 'A record with this value already exists';
    return res.status(409).json({ error: msg });
  }

  const ref = `ERR-${Date.now().toString(36).toUpperCase()}`;
  const reqWithId = req as Request & { id?: string };
  logger.error({ err, ref, requestId: reqWithId?.id }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production'
    ? `Something went wrong. If this persists, contact support (ref: ${ref})`
    : (err?.message ?? 'Internal server error');
  res.status(500).json({ error: message });
}
