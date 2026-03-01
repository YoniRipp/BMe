/**
 * Goal routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import * as goalController from '../controllers/goal.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/goals', withUser, goalController.list);
router.post('/api/goals', withUser, idempotencyMiddleware, goalController.add);
router.patch('/api/goals/:id', withUser, goalController.update);
router.delete('/api/goals/:id', withUser, goalController.remove);

export default router;
