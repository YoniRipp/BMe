import { request } from './client';
import { apiTransactionSchema } from '@/schemas/transaction';

export type ApiTransaction = import('@/schemas/transaction').ApiTransaction;

function parseTransaction(data: unknown): ApiTransaction {
  const result = apiTransactionSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? 'Invalid transaction response';
    throw new Error(msg);
  }
  return result.data;
}

export const transactionsApi = {
  list: async (params?: { month?: string; type?: 'income' | 'expense'; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set('month', params.month);
    if (params?.type) q.set('type', params.type);
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const query = q.toString();
    const res = await request<{ items: unknown[]; total: number }>(`/api/transactions${query ? `?${query}` : ''}`);
    return (res?.items ?? []).map(parseTransaction);
  },
  add: async (tx: {
    date?: string;
    type: 'income' | 'expense';
    amount: number;
    currency?: string;
    category?: string;
    description?: string;
    isRecurring?: boolean;
    groupId?: string;
  }) => {
    const data = await request<unknown>('/api/transactions', { method: 'POST', body: tx });
    return parseTransaction(data);
  },
  update: async (id: string, updates: Partial<ApiTransaction>) => {
    const data = await request<unknown>(`/api/transactions/${id}`, { method: 'PATCH', body: updates });
    return parseTransaction(data);
  },
  delete: (id: string) => request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
};
