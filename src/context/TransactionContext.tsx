import React, { createContext, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { SAMPLE_TRANSACTIONS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  // Initialize with sample data if no data exists
  const initializeTransactions = () => {
    const existing = storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
    return existing || SAMPLE_TRANSACTIONS;
  };

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    STORAGE_KEYS.TRANSACTIONS,
    initializeTransactions()
  );

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  }, [setTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [setTransactions]);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById
    }}>
      {children}
    </TransactionContext.Provider>
  );
}
