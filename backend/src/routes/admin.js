/**
 * Admin routes — logs, activity, user search (require admin).
 */
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getPool } from '../db/index.js';
import * as appLog from '../services/appLog.js';
import * as userActivityLog from '../models/userActivityLog.js';

const router = Router();

function rowToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

router.get('/api/admin/logs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const level = req.query.level === 'error' ? 'error' : 'action';
    const logs = await appLog.listLogs(level);
    res.json({ logs });
  } catch (e) {
    next(e);
  }
});

router.get('/api/admin/activity', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { limit, before, from, to, userId, eventType } = req.query ?? {};
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b94650'},body:JSON.stringify({sessionId:'b94650',location:'admin.js:activity_entry',message:'Activity route entered',data:{from,to,hasUser:!!req.user,userRole:req.user?.role},timestamp:Date.now(),hypothesisId:'H1_H2'})}).catch(()=>{});
    // #endregion
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to (ISO UTC) are required' });
    }
    const result = await userActivityLog.listActivity({
      limit: limit ? parseInt(limit, 10) : undefined,
      before: typeof before === 'string' ? before : undefined,
      from,
      to,
      userId: typeof userId === 'string' ? userId : undefined,
      eventType: typeof eventType === 'string' ? eventType : undefined,
    });
    res.json(result);
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b94650'},body:JSON.stringify({sessionId:'b94650',location:'admin.js:activity_catch',message:'Activity handler error',data:{err:String(e?.message||e),stack:e?.stack?.slice(0,200)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    if (e.message?.includes('required') || e.message?.includes('range') || e.message?.includes('exceed')) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

router.get('/api/admin/users/search', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 20), 100);
    if (!q || q.length < 1) {
      return res.json([]);
    }
    const pool = getPool();
    const pattern = `%${q}%`;
    const result = await pool.query(
      `SELECT id, email, name, role, created_at FROM users
       WHERE email ILIKE $1 OR name ILIKE $1
       ORDER BY name ASC
       LIMIT $2`,
      [pattern, limit]
    );
    res.json(result.rows.map(rowToUser));
  } catch (e) {
    next(e);
  }
});

export default router;
