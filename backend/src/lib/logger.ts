/**
 * Structured logger (Pino). Use for server-side logging.
 * Never log secrets or PII; stack traces only server-side.
 * Output: level, message, timestamp, and optional data (requestId, userId, etc.).
 */
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
});

/** Create a child logger with a module name for filtering. */
export function createModuleLogger(module) {
  return logger.child({ module });
}
