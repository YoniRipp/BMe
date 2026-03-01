/**
 * File upload routes (S3 pre-signed URL pattern).
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as uploadsController from '../controllers/uploads.js';

const router = Router();

router.post('/api/uploads/presigned-url', requireAuth, uploadsController.presignedUrl);

export default router;
