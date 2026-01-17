import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import {
  createScheduleItemSchema,
  updateScheduleItemSchema,
} from '../types/schedule.types';

const router = Router();

router.use(authMiddleware);

router.get('/', ScheduleController.getAll);
router.get('/:id', ScheduleController.getById);
router.post(
  '/',
  validateRequest(createScheduleItemSchema),
  ScheduleController.create
);
router.put(
  '/:id',
  validateRequest(updateScheduleItemSchema),
  ScheduleController.update
);
router.delete('/:id', ScheduleController.delete);

export default router;