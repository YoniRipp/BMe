/**
 * AsyncLocalStorage for request-scoped data (e.g. requestId for tracing).
 * Used by middleware and publishEvent to correlate logs and events.
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Get the current request's ID (correlationId) if within a request scope. */
export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
