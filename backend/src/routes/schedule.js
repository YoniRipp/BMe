/**
 * Schedule routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import * as scheduleController from '../controllers/schedule.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/schedule', withUser, scheduleController.list);
router.post('/api/schedule', withUser, idempotencyMiddleware, scheduleController.add);
router.post('/api/schedule/batch', withUser, idempotencyMiddleware, scheduleController.addBatch);
router.patch('/api/schedule/:id', withUser, scheduleController.update);
router.put('/api/schedule/:id', withUser, scheduleController.update);
router.delete('/api/schedule/:id', withUser, scheduleController.remove);

export default router;
