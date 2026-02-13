import { request } from './client';

export interface AppLogEntry {
  id: string;
  level: 'action' | 'error';
  message: string;
  details: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
}

export interface LogsResponse {
  logs: AppLogEntry[];
}

export const adminApi = {
  getLogs: (level: 'action' | 'error') =>
    request<LogsResponse>(`/api/admin/logs?level=${level}`).then((r) => r.logs),
};
