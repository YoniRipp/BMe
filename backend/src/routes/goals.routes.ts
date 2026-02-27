import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import { createGoalSchema, updateGoalSchema } from '../types/goals.types';

const router = Router();

router.use(authMiddleware);

router.get('/', GoalsController.getAll);
router.get('/:id', GoalsController.getById);
router.post('/', validateRequest(createGoalSchema), GoalsController.create);
router.put('/:id', validateRequest(updateGoalSchema), GoalsController.update);
router.delete('/:id', GoalsController.delete);

export default router;