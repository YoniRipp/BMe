/**
 * Request ID middleware: reads X-Request-Id from headers or generates one,
 * stores in AsyncLocalStorage for tracing, attaches to req, and echoes in response.
 */
import crypto from 'crypto';
import { requestContext } from '../lib/requestContext.js';

export function requestIdMiddleware(
  req: import('express').Request & { id?: string },
  res: import('express').Response,
  next: import('express').NextFunction
) {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  requestContext.run({ requestId: id }, () => next());
}
