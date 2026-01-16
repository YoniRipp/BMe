export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  isRecurring: boolean;
  groupId?: string;
}

export const TRANSACTION_CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Housing', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Other']
} as const;
