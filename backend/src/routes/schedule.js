/**
 * Schedule routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import * as scheduleController from '../controllers/schedule.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/schedule', withUser, scheduleController.list);
router.post('/api/schedule', withUser, scheduleController.add);
router.post('/api/schedule/batch', withUser, scheduleController.addBatch);
router.patch('/api/schedule/:id', withUser, scheduleController.update);
router.put('/api/schedule/:id', withUser, scheduleController.update);
router.delete('/api/schedule/:id', withUser, scheduleController.remove);

export default router;
