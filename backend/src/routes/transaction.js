/**
 * Transaction routes.
 */
import { Router } from 'express';
import { requireAuth, resolveEffectiveUserId } from '../middleware/auth.js';
import * as transactionController from '../controllers/transaction.js';

const router = Router();
const withUser = [requireAuth, resolveEffectiveUserId];

router.get('/api/transactions', withUser, transactionController.list);
router.post('/api/transactions', withUser, transactionController.add);
router.patch('/api/transactions/:id', withUser, transactionController.update);
router.delete('/api/transactions/:id', withUser, transactionController.remove);
router.get('/api/balance', withUser, transactionController.balance);

export default router;
