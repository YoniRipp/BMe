import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Transaction } from '@/types/transaction';
import { transactionApi } from '@/lib/api/transactions';
import { toast } from 'sonner';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  refreshTransactions: () => Promise<void>;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTransactions = useCallback(async () => {
    try {
      const data = await transactionApi.getAll();
      setTransactions(data);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    }
  }, []);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      await refreshTransactions();
      setLoading(false);
    };
    loadTransactions();
  }, [refreshTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await transactionApi.create(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transaction added successfully');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to add transaction');
      throw error;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      const updated = await transactionApi.update(id, updates);
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
      toast.success('Transaction updated successfully');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update transaction');
      throw error;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionApi.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete transaction');
      throw error;
    }
  }, []);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      refreshTransactions,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = React.useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}