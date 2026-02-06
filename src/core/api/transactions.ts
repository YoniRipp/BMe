import { request } from './client';

export interface ApiTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  isRecurring: boolean;
  groupId?: string;
}

export const transactionsApi = {
  list: (params?: { month?: string; type?: 'income' | 'expense'; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set('month', params.month);
    if (params?.type) q.set('type', params.type);
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const query = q.toString();
    return request<{ items: ApiTransaction[]; total: number }>(`/api/transactions${query ? `?${query}` : ''}`).then(
      (r) => r.items
    ) as Promise<ApiTransaction[]>;
  },
  add: (tx: {
    date?: string;
    type: 'income' | 'expense';
    amount: number;
    category?: string;
    description?: string;
    isRecurring?: boolean;
    groupId?: string;
  }) => request<ApiTransaction>('/api/transactions', { method: 'POST', body: tx }),
  update: (id: string, updates: Partial<ApiTransaction>) =>
    request<ApiTransaction>(`/api/transactions/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
};
