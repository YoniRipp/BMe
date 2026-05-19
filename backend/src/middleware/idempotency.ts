/**
 * Idempotency key support for create operations.
 * If X-Idempotency-Key (or body.idempotencyKey) is set and we have a cached response
 * for that key (within TTL), return the same response. Otherwise run the handler
 * and cache 2xx responses for 24h.
 * Uses Redis when REDIS_URL is set; in-memory otherwise.
 */
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { kvGet, kvSet } from '../lib/keyValueStore.js';
import { logger } from '../lib/logger.js';

const TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'idempotency:';

interface CachedResponse {
  statusCode: number;
  body: unknown;
  bodyHash: string;
  userId: string;
  method: string;
  route: string;
}

function getKey(req: Request): string | null {
  const header = req.get('X-Idempotency-Key');
  if (header && typeof header === 'string' && header.trim()) return header.trim();
  const body = req.body && req.body.idempotencyKey;
  if (body && typeof body === 'string' && body.trim()) return body.trim();
  return null;
}

function stableStringify(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'idempotencyKey')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashBody(body: unknown): string {
  return createHash('sha256').update(stableStringify(body)).digest('hex');
}

function getScope(req: Request) {
  const userId = req.user?.id ?? 'anonymous';
  const route = req.baseUrl + (req.route?.path ? String(req.route.path) : req.path);
  return {
    userId,
    method: req.method.toUpperCase(),
    route,
    bodyHash: hashBody(req.body),
  };
}

/**
 * Middleware. Use only on POST create routes. Reads idempotency key from
 * X-Idempotency-Key header or body.idempotencyKey; returns cached response
 * if key was used before within TTL.
 */
export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = getKey(req);
  if (!key) return next();

  const scope = getScope(req);
  const scopeHash = createHash('sha256')
    .update(`${scope.userId}:${scope.method}:${scope.route}:${key}`)
    .digest('hex');
  const storeKey = KEY_PREFIX + scopeHash;
  const raw = await kvGet(storeKey);
  if (raw) {
    try {
      const cached = JSON.parse(raw) as CachedResponse;
      if (cached.bodyHash !== scope.bodyHash) {
        logger.warn({ userId: scope.userId, method: scope.method, route: scope.route }, 'Idempotency key reused with different body');
        return res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Idempotency key was already used with a different request body',
          },
        });
      }
      if (cached.statusCode && cached.body != null) {
        return res.status(cached.statusCode).json(cached.body);
      }
    } catch {
      // Invalid cached value, continue
    }
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const payload: CachedResponse = { statusCode: res.statusCode, body, ...scope };
      kvSet(storeKey, JSON.stringify(payload), TTL_MS).catch(() => {});
    }
    return originalJson(body);
  };
  next();
}
