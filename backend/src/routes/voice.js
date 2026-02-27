/**
 * Voice routes.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as voiceController from '../controllers/voice.js';

const router = Router();

router.post('/api/voice/understand', requireAuth, voiceController.understand);

export default router;
