/**
 * Voice routes.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireProWithTrial } from '../middleware/requireProWithTrial.js';
import { voiceRateLimit } from '../middleware/aiRateLimit.js';
import * as voiceController from '../controllers/voice.js';

const router = Router();

router.post('/api/voice/understand', requireAuth, requireProWithTrial, voiceRateLimit, voiceController.understand);

export default router;
