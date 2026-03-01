/**
 * Food entry routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import * as foodEntryController from '../controllers/foodEntry.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/food-entries', withUser, foodEntryController.list);
router.post('/api/food-entries', withUser, idempotencyMiddleware, foodEntryController.add);
router.patch('/api/food-entries/:id', withUser, foodEntryController.update);
router.delete('/api/food-entries/:id', withUser, foodEntryController.remove);

export default router;
