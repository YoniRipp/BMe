/**
 * Admin routes — logs (require admin).
 */
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as appLog from '../services/appLog.js';

const router = Router();

router.get('/api/admin/logs', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const level = req.query.level === 'error' ? 'error' : 'action';
    const logs = await appLog.listLogs(level);
    res.json({ logs });
  } catch (e) {
    next(e);
  }
});

export default router;
