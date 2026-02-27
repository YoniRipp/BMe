import { z } from 'zod';

export const apiTransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  currency: z.string().optional(),
  category: z.string(),
  description: z.string().optional(),
  isRecurring: z.boolean(),
  groupId: z.string().optional().nullable(),
});

export type ApiTransaction = z.infer<typeof apiTransactionSchema>;
