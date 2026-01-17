import apiClient from './client';
import { Transaction } from '@/types/transaction';

export const transactionApi = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await apiClient.get('/transactions');
    return response.data.data.map((t: any) => ({
      ...t,
      date: new Date(t.date),
    }));
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${id}`);
    const t = response.data.data;
    return {
      ...t,
      date: new Date(t.date),
    };
  },

  create: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', transaction);
    const t = response.data.data;
    return {
      ...t,
      date: new Date(t.date),
    };
  },

  update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const response = await apiClient.put(`/transactions/${id}`, transaction);
    const t = response.data.data;
    return {
      ...t,
      date: new Date(t.date),
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  getStats: async () => {
    const response = await apiClient.get('/transactions/stats');
    return response.data.data;
  },
};