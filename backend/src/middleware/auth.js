/**
 * Authentication middleware.
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getPool } from '../db/pool.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);

  // MCP server: accept shared secret and impersonate a user (for Cursor MCP integration)
  if (config.mcpSecret && config.mcpUserId && token === config.mcpSecret) {
    req.user = { id: config.mcpUserId, email: 'mcp@local', role: 'user' };
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.js:requireAuth', message: 'auth set (mcp)', data: { userIdPreview: String(config.mcpUserId).slice(0, 8), source: 'mcp' }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
    // #endregion
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.js:requireAuth', message: 'auth set (jwt)', data: { userIdPreview: String(payload.sub).slice(0, 8), hasSub: typeof payload.sub === 'string' }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
    // #endregion
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Synchronous version for backwards compatibility. Prefer getEffectiveUserIdAsync in controllers
 * when admin userId override may be used, so the target user can be validated.
 */
export function getEffectiveUserId(req) {
  return req.effectiveUserId != null ? req.effectiveUserId : req.user.id;
}

/**
 * Resolve effective user id (self or admin override). When admin passes userId, validates that
 * the user exists. Call this after requireAuth and set req.effectiveUserId before controllers run.
 */
export async function resolveEffectiveUserId(req, res, next) {
  const adminUserId = req.query.userId || req.body?.userId;
  if (req.user.role !== 'admin' || !adminUserId) {
    req.effectiveUserId = req.user.id;
    return next();
  }
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [adminUserId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.effectiveUserId = result.rows[0].id;
    next();
  } catch (e) {
    next(e);
  }
}
