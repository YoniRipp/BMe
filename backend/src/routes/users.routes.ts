import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import { updateSettingsSchema } from '../types/settings.types';

const router = Router();

router.use(authMiddleware);

router.get('/settings', SettingsController.get);
router.put('/settings', validateRequest(updateSettingsSchema), SettingsController.update);

export default router;