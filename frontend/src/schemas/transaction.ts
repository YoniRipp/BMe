import { z } from 'zod';
import { TRANSACTION_CATEGORIES } from '@/types/transaction';

const incomeCategories: readonly string[] = TRANSACTION_CATEGORIES.income;
const expenseCategories: readonly string[] = TRANSACTION_CATEGORIES.expense;

/** API response shape for a single transaction (date is ISO string). */
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

/** Form schema for transaction modal (string amount and date for inputs). */
export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1, 'Amount is required').refine(
    (v) => {
      const n = parseFloat(v);
      return !Number.isNaN(n) && n >= 0.01 && n <= 1_000_000;
    },
    { message: 'Amount must be between 0.01 and 1,000,000' }
  ),
  currency: z.string().min(3).max(3).optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  isRecurring: z.boolean(),
  groupId: z.string().optional(),
}).refine(
  (data) => {
    const allowed = data.type === 'income' ? incomeCategories : expenseCategories;
    return allowed.includes(data.category);
  },
  { message: 'Category must be one of the allowed values', path: ['category'] }
);

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
