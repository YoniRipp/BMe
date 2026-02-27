import { request } from './client';

export interface ApiScheduleItem {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  emoji?: string;
  order: number;
  isActive: boolean;
  groupId?: string;
  recurrence?: 'daily' | 'weekdays' | 'weekends';
  color?: string;
}

export const scheduleApi = {
  list: () => request<ApiScheduleItem[]>('/api/schedule'),
  add: (item: {
    title: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    category?: string;
    emoji?: string;
    order?: number;
    isActive?: boolean;
    groupId?: string;
    recurrence?: 'daily' | 'weekdays' | 'weekends';
    color?: string;
  }) => request<ApiScheduleItem>('/api/schedule', { method: 'POST', body: item }),
  addBatch: (
    items: {
      title: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      category?: string;
      emoji?: string;
      groupId?: string;
      recurrence?: 'daily' | 'weekdays' | 'weekends';
      color?: string;
    }[]
  ) => request<ApiScheduleItem[]>('/api/schedule/batch', { method: 'POST', body: { items } }),
  update: (
    id: string,
    updates: Partial<{
      date: string;
      title: string;
      startTime: string;
      endTime: string;
      category: string;
      emoji: string;
      order: number;
      isActive: boolean;
      groupId: string;
      recurrence: 'daily' | 'weekdays' | 'weekends';
      color: string;
    }>
  ) => request<ApiScheduleItem>(`/api/schedule/${id}`, { method: 'PATCH', body: updates }),
  delete: (id: string) => request<void>(`/api/schedule/${id}`, { method: 'DELETE' }),
};
