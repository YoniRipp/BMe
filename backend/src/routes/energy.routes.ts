import { Router } from 'express';
import { EnergyController } from '../controllers/energy.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import {
  createEnergyCheckInSchema,
  updateEnergyCheckInSchema,
  createFoodEntrySchema,
  updateFoodEntrySchema,
} from '../types/energy.types';

const router = Router();

router.use(authMiddleware);

// Check-ins
router.get('/checkins', EnergyController.getAllCheckIns);
router.get('/checkins/:id', EnergyController.getCheckInById);
router.post(
  '/checkins',
  validateRequest(createEnergyCheckInSchema),
  EnergyController.createCheckIn
);
router.put(
  '/checkins/:id',
  validateRequest(updateEnergyCheckInSchema),
  EnergyController.updateCheckIn
);
router.delete('/checkins/:id', EnergyController.deleteCheckIn);

// Food entries
router.get('/food', EnergyController.getAllFoodEntries);
router.get('/food/:id', EnergyController.getFoodEntryById);
router.post(
  '/food',
  validateRequest(createFoodEntrySchema),
  EnergyController.createFoodEntry
);
router.put(
  '/food/:id',
  validateRequest(updateFoodEntrySchema),
  EnergyController.updateFoodEntry
);
router.delete('/food/:id', EnergyController.deleteFoodEntry);

export default router;