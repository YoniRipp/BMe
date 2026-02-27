/**
 * Workout routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import * as workoutController from '../controllers/workout.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/workouts', withUser, workoutController.list);
router.post('/api/workouts', withUser, idempotencyMiddleware, workoutController.add);
router.patch('/api/workouts/:id', withUser, workoutController.update);
router.delete('/api/workouts/:id', withUser, workoutController.remove);

export default router;
