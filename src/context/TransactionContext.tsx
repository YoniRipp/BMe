import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Transaction } from '@/types/transaction';
import { transactionsApi } from '@/lib/api';

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

function apiToTransaction(a: { id: string; date: string; type: 'income' | 'expense'; amount: number; category: string; description?: string; isRecurring: boolean; groupId?: string }): Transaction {
  return {
    id: a.id,
    date: new Date(a.date),
    type: a.type,
    amount: a.amount,
    category: a.category,
    description: a.description,
    isRecurring: a.isRecurring,
    groupId: a.groupId,
  };
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const refetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const list = await transactionsApi.list();
      setTransactions(list.map(apiToTransaction));
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

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    setTransactionsError(null);
    const body = {
      date: transaction.date instanceof Date ? transaction.date.toISOString().slice(0, 10) : transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      isRecurring: transaction.isRecurring,
      groupId: transaction.groupId,
    };
    transactionsApi.add(body).then(created => {
      setTransactions(prev => [...prev, apiToTransaction(created)]);
    }).catch(e => {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to add transaction');
    });
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactionsError(null);
    const body: Record<string, unknown> = { ...updates };
    if (updates.date !== undefined) {
      body.date = updates.date instanceof Date ? updates.date.toISOString().slice(0, 10) : updates.date;
    }
    transactionsApi.update(id, body as Parameters<typeof transactionsApi.update>[1]).then(updated => {
      setTransactions(prev =>
        prev.map(t => t.id === id ? apiToTransaction(updated) : t)
      );
    }).catch(e => {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to update transaction');
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactionsError(null);
    transactionsApi.delete(id).then(() => {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }).catch(e => {
      setTransactionsError(e instanceof Error ? e.message : 'Failed to delete transaction');
    });
  }, []);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      transactionsLoading,
      transactionsError,
      refetchTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById
    }}>
      {children}
    </TransactionContext.Provider>
  );
}
