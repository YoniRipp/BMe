import { z } from 'zod';

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const createTransactionSchema = z.object({
  date: z.coerce.date(),
  type: transactionTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  groupId: z.string().uuid().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;