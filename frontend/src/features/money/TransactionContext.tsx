import React, { createContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/types/transaction';
import { transactionsApi } from '@/features/money/api';
import { apiTransactionToTransaction } from '@/features/money/mappers';
import { queryKeys } from '@/lib/queryClient';

interface TransactionContextType {
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  refetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsQueryError,
    refetch: refetchTransactionsQuery,
  } = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => {
      const list = await transactionsApi.list();
      return list.map(apiTransactionToTransaction);
    },
  });

  const transactionsError = transactionsQueryError
    ? (transactionsQueryError instanceof Error ? transactionsQueryError.message : 'Failed to load transactions')
    : null;

  const refetchTransactions = useCallback(async () => {
    await refetchTransactionsQuery();
  }, [refetchTransactionsQuery]);

  const addMutation = useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id'>) => {
      const body = {
        date:
          transaction.date instanceof Date
            ? transaction.date.toISOString().slice(0, 10)
            : transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        isRecurring: transaction.isRecurring,
        groupId: transaction.groupId,
      };
      return transactionsApi.add(body);
    },
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.transactions, (prev: Transaction[] | undefined) =>
        prev ? [...prev, apiTransactionToTransaction(created)] : [apiTransactionToTransaction(created)]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const body: Record<string, unknown> = { ...updates };
      if (updates.date !== undefined) {
        body.date =
          updates.date instanceof Date ? updates.date.toISOString().slice(0, 10) : updates.date;
      }
      return transactionsApi.update(id, body as Parameters<typeof transactionsApi.update>[1]);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.transactions, (prev: Transaction[] | undefined) =>
        prev
          ? prev.map((t) => (t.id === updated.id ? apiTransactionToTransaction(updated) : t))
          : [apiTransactionToTransaction(updated)]
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.transactions, (prev: Transaction[] | undefined) =>
        prev ? prev.filter((t) => t.id !== id) : []
      );
    },
  });

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id'>): Promise<void> =>
      addMutation.mutateAsync(transaction).then(() => undefined),
    [addMutation]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>): Promise<void> =>
      updateMutation.mutateAsync({ id, updates }).then(() => undefined),
    [updateMutation]
  );

  const deleteTransaction = useCallback(
    (id: string): Promise<void> => deleteMutation.mutateAsync(id).then(() => undefined),
    [deleteMutation]
  );

  const getTransactionById = useCallback(
    (id: string) => transactions.find((t) => t.id === id),
    [transactions]
  );

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        transactionsLoading,
        transactionsError,
        refetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
