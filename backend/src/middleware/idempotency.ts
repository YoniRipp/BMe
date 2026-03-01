/**
 * Idempotency key support for create operations.
 * If X-Idempotency-Key (or body.idempotencyKey) is set and we have a cached response
 * for that key (within TTL), return the same response. Otherwise run the handler
 * and cache 2xx responses for 24h.
 * Uses Redis when REDIS_URL is set; in-memory otherwise.
 */
import { kvGet, kvSet } from '../lib/keyValueStore.js';

const TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'idempotency:';

function getKey(req) {
  const header = req.get('X-Idempotency-Key');
  if (header && typeof header === 'string' && header.trim()) return header.trim();
  const body = req.body && req.body.idempotencyKey;
  if (body && typeof body === 'string' && body.trim()) return body.trim();
  return null;
}

/**
 * Middleware. Use only on POST create routes. Reads idempotency key from
 * X-Idempotency-Key header or body.idempotencyKey; returns cached response
 * if key was used before within TTL.
 */
export async function idempotencyMiddleware(req, res, next) {
  const key = getKey(req);
  if (!key) return next();

  const storeKey = KEY_PREFIX + key;
  const raw = await kvGet(storeKey);
  if (raw) {
    try {
      const cached = JSON.parse(raw);
      if (cached.statusCode && cached.body != null) {
        return res.status(cached.statusCode).json(cached.body);
      }
    } catch {
      // Invalid cached value, continue
    }
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      kvSet(storeKey, JSON.stringify({ statusCode: res.statusCode, body }), TTL_MS).catch(() => {});
    }
    return originalJson(body);
  };
  next();
}
