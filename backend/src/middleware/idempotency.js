/**
 * Idempotency key support for create operations.
 * If X-Idempotency-Key (or body.idempotencyKey) is set and we have a cached response
 * for that key (within TTL), return the same response. Otherwise run the handler
 * and cache 2xx responses for 24h.
 */
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 10000;
const cache = new Map();

function prune() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  // Evict oldest entries if still over limit
  if (cache.size > MAX_CACHE_SIZE) {
    const toRemove = cache.size - MAX_CACHE_SIZE;
    let removed = 0;
    for (const key of cache.keys()) {
      if (removed >= toRemove) break;
      cache.delete(key);
      removed++;
    }
  }
}

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
export function idempotencyMiddleware(req, res, next) {
  const key = getKey(req);
  if (!key) return next();

  prune();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return res.status(cached.statusCode).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, {
        statusCode: res.statusCode,
        body,
        expiresAt: Date.now() + TTL_MS,
      });
    }
    return originalJson(body);
  };
  next();
}
