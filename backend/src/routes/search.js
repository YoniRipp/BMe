/**
 * Semantic search routes.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as searchController from '../controllers/search.js';

const router = Router();

router.post('/api/search', requireAuth, searchController.search);

export default router;
