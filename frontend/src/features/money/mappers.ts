import { Transaction } from '@/types/transaction';
import type { ApiTransaction } from '@/core/api/transactions';
import { parseLocalDateString } from '@/lib/dateRanges';

export function apiTransactionToTransaction(a: ApiTransaction): Transaction {
  return {
    id: a.id,
    date: parseLocalDateString(a.date),
    type: a.type,
    amount: a.amount,
    currency: a.currency ?? 'USD',
    category: a.category,
    description: a.description,
    isRecurring: a.isRecurring,
    groupId: a.groupId ?? undefined,
  };
}
