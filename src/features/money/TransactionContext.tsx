import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Transaction } from '@/types/transaction';
import { transactionsApi } from '@/features/money/api';
import { apiTransactionToTransaction } from '@/features/money/mappers';

interface TransactionContextType {
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  refetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const refetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const list = await transactionsApi.list();
      setTransactions(list.map(apiTransactionToTransaction));
    } catch (e) {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchTransactions();
  }, [refetchTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>): Promise<void> => {
    setTransactionsError(null);
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
    try {
      const created = await transactionsApi.add(body);
      setTransactions((prev) => [...prev, apiTransactionToTransaction(created)]);
    } catch (e) {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to add transaction');
      throw e;
    }
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactionsError(null);
    const body: Record<string, unknown> = { ...updates };
    if (updates.date !== undefined) {
      body.date =
        updates.date instanceof Date ? updates.date.toISOString().slice(0, 10) : updates.date;
    }
    transactionsApi
      .update(id, body as Parameters<typeof transactionsApi.update>[1])
      .then((updated) =>
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? apiTransactionToTransaction(updated) : t))
        )
      )
      .catch((e) => {
        setTransactionsError(e instanceof Error ? e.message : 'Failed to update transaction');
      });
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    setTransactionsError(null);
    try {
      await transactionsApi.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to delete transaction');
      throw e;
    }
  }, []);

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
