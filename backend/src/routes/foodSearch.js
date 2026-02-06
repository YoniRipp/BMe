/**
 * Food search routes. No auth.
 */
import { Router } from 'express';
import * as foodSearchController from '../controllers/foodSearch.js';

const router = Router();

router.get('/api/food/search', foodSearchController.search);

export default router;
