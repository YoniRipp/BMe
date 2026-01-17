import { Router } from 'express';
import { WorkoutsController } from '../controllers/workouts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import { createWorkoutSchema, updateWorkoutSchema } from '../types/workouts.types';

const router = Router();

router.use(authMiddleware);

router.get('/', WorkoutsController.getAll);
router.get('/:id', WorkoutsController.getById);
router.post('/', validateRequest(createWorkoutSchema), WorkoutsController.create);
router.put('/:id', validateRequest(updateWorkoutSchema), WorkoutsController.update);
router.delete('/:id', WorkoutsController.delete);

export default router;