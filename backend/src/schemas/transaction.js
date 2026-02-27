/**
 * Zod schemas for transaction request bodies.
 */
import { z } from 'zod';
import { TRANSACTION_CATEGORIES } from '../config/constants.js';

const incomeCategories = TRANSACTION_CATEGORIES.income;
const expenseCategories = TRANSACTION_CATEGORIES.expense;
const allCategories = [...incomeCategories, ...expenseCategories];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const currencyCode = z.string().length(3).optional().default('USD').transform((s) => (s || 'USD').toUpperCase());

export const createTransactionSchema = z.object({
  date: dateString.optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0, 'Amount must be non-negative').finite(),
  currency: currencyCode.optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  groupId: z.string().nullable().optional(),
}).refine(
  (data) => {
    const cat = data.category;
    if (!cat) return true;
    const allowed = data.type === 'income' ? incomeCategories : data.type === 'expense' ? expenseCategories : allCategories;
    return allowed.includes(cat);
  },
  { message: 'Category must be one of the allowed values for the given type', path: ['category'] }
);

export const updateTransactionSchema = z.object({
  date: dateString.optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().min(0).finite().optional(),
  currency: z.string().length(3).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  groupId: z.string().nullable().optional(),
}).refine(
  (data) => {
    if (data.category == null || data.type == null) return true;
    const allowed = data.type === 'income' ? incomeCategories : expenseCategories;
    return allowed.includes(data.category);
  },
  { message: 'Category must be one of the allowed values for the given type', path: ['category'] }
);
