import { request } from './client';

export interface ApiUserListItem {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export const usersApi = {
  list: () => request<ApiUserListItem[]>('/api/users'),
  create: (u: { email: string; password: string; name: string; role?: 'admin' | 'user' }) =>
    request<ApiUserListItem>('/api/users', { method: 'POST', body: u }),
  update: (id: string, updates: { name?: string; role?: 'admin' | 'user'; password?: string }) =>
    request<ApiUserListItem>(`/api/users/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};
