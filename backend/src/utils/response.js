/**
 * Response helpers for controllers.
 */

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 */
export function sendJson(res, data) {
  res.json(data);
}

/**
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {Record<string, unknown>} [extra]
 */
export function sendError(res, status, message, extra = {}) {
  res.status(status).json({ error: message, ...extra });
}

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 */
export function sendCreated(res, data) {
  res.status(201).json(data);
}

/**
 * @param {import('express').Response} res
 */
export function sendNoContent(res) {
  res.status(204).send();
}
