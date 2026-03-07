/**
 * Health sync routes.
 */
import { Router } from 'express';
import { withUser } from './helpers.js';
import { validateBody } from '../middleware/validateBody.js';
import { healthSyncSchema } from '../schemas/routeSchemas.js';
import * as healthSyncController from '../controllers/healthSync.js';

const router = Router();

router.post('/api/health/sync', withUser, validateBody(healthSyncSchema), healthSyncController.sync);
router.get('/api/health/sync-state', withUser, healthSyncController.getSyncState);
router.put('/api/health/sync-state', withUser, healthSyncController.updateSyncState);
router.get('/api/health/metrics', withUser, healthSyncController.getMetrics);

export default router;
