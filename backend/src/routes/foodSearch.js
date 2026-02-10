/**
 * Food search routes. No auth.
 */
import { Router } from 'express';
import { validateBody } from '../middleware/validateBody.js';
import { lookupOrCreateFoodSchema } from '../schemas/food.js';
import * as foodSearchController from '../controllers/foodSearch.js';

const router = Router();

router.get('/api/food/search', foodSearchController.search);
router.post('/api/food/lookup-or-create', validateBody(lookupOrCreateFoodSchema), foodSearchController.lookupOrCreate);

export default router;
