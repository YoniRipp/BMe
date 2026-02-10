import { Transaction } from '@/types/transaction';
import type { ApiTransaction } from '@/core/api/transactions';

export function apiTransactionToTransaction(a: ApiTransaction): Transaction {
  return {
    id: a.id,
    date: new Date(a.date),
    type: a.type,
    amount: a.amount,
    category: a.category,
    description: a.description,
    isRecurring: a.isRecurring,
    groupId: a.groupId ?? undefined,
  };
}
