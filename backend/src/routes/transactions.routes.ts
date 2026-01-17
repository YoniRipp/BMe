import { Router } from 'express';
import { TransactionsController } from '../controllers/transactions.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../types/transactions.types';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', TransactionsController.getAll);
router.get('/stats', TransactionsController.getStats);
router.get('/:id', TransactionsController.getById);
router.post('/', validateRequest(createTransactionSchema), TransactionsController.create);
router.put('/:id', validateRequest(updateTransactionSchema), TransactionsController.update);
router.delete('/:id', TransactionsController.delete);

export default router;