/**
 * Response helpers for controllers.
 */
import { Response } from 'express';

/**
 * @param {Response} res
 * @param {unknown} data
 */
export function sendJson(res: Response, data: unknown) {
  res.json(data);
}

/**
 * @param {Response} res
 * @param {number} status
 * @param {string} message
 * @param {Record<string, unknown>} [extra]
 */
export function sendError(res: Response, status: number, message: string, extra: Record<string, unknown> = {}) {
  res.status(status).json({ error: message, ...extra });
}

/**
 * @param {Response} res
 * @param {unknown} data
 */
export function sendCreated(res: Response, data: unknown) {
  res.status(201).json(data);
}

/**
 * @param {Response} res
 */
export function sendNoContent(res: Response) {
  res.status(204).send();
}
