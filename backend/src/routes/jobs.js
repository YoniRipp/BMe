/**
 * Job status routes.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as jobsController from '../controllers/jobs.js';

const router = Router();

router.get('/api/jobs/:jobId', requireAuth, jobsController.getJobStatus);

export default router;
