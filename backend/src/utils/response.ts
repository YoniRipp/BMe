/**
 * Response helpers for controllers.
 */
import { Response } from 'express';
import type { ErrorCode } from '../errors.js';

export function sendJson(res: Response, data: unknown) {
  res.json(data);
}

export function sendCreated(res: Response, data: unknown) {
  res.status(201).json(data);
}

export function sendNoContent(res: Response) {
  res.status(204).send();
}

export function sendError(res: Response, status: number, message: string, extra: { code?: ErrorCode; details?: unknown } = {}) {
  res.status(status).json({
    error: {
      code: extra.code ?? 'INTERNAL_ERROR',
      message,
      ...(extra.details != null ? { details: extra.details } : {}),
    },
  });
}

export function sendPaginated<T>(res: Response, data: T[], total: number, limit: number, offset: number) {
  res.json({
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  });
}
