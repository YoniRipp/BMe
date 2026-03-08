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

export interface UserActivityEvent {
  id: string;
  eventType: string;
  eventId: string;
  summary: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
}

export interface UserActivityResponse {
  events: UserActivityEvent[];
  nextCursor?: string;
}

export interface ApiUserSearchItem {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

function buildActivityQuery(opts: {
  limit?: number;
  before?: string;
  from: string;
  to: string;
  userId?: string;
  eventType?: string;
}) {
  const params = new URLSearchParams();
  params.set('from', opts.from);
  params.set('to', opts.to);
  if (opts.limit != null) params.set('limit', String(opts.limit));
  if (opts.before) params.set('before', opts.before);
  if (opts.userId) params.set('userId', opts.userId);
  if (opts.eventType) params.set('eventType', opts.eventType);
  return params.toString();
}

export interface BusinessOverview {
  totalUsers: number;
  newUsersThisWeek: number;
  proSubscribers: number;
  churned: number;
  voiceCallsThisMonth: number;
  weeklyActiveUsers: number;
}

export interface VoiceHeavyUser {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  voiceCalls: number;
  lastActive: string;
}

export interface AdminRecentErrors {
  count: number;
  lastErrorMessage: string | null;
}

export interface AdminStatsResponse {
  overview: BusinessOverview;
  userGrowth: Array<{ date: string; count: number }>;
  dailyVoiceCalls: Array<{ date: string; calls: number }>;
  voiceHeavyUsers: VoiceHeavyUser[];
  recentErrors: AdminRecentErrors;
}

export interface RouteMetric {
  route: string;
  total: number;
  statusCounts: Record<number, number>;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

export interface AdminMetricsResponse {
  uptime: { seconds: number; startedAt: string };
  http: { routes: RouteMetric[]; totalRequests: number };
  db: {
    totalQueries: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    maxMs: number;
    errors: number;
    slowQueries: Array<{ sql: string; durationMs: number; timestamp: number }>;
  };
  errors: { total: number; byCode: Record<string, number> };
  events: { published: number; processed: number; failed: number };
  system: {
    memoryMb: { rss: number; heapUsed: number; heapTotal: number; external: number };
    nodeVersion: string;
    pid: number;
    cpuUsage: { user: number; system: number };
  };
}

export interface QueueInfo {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed?: number;
}

export const adminApi = {
  getLogs: (level: 'action' | 'error') =>
    request<LogsResponse>(`/api/admin/logs?level=${level}`).then((r) => r.logs),

  getActivity: (opts: {
    limit?: number;
    before?: string;
    from: string;
    to: string;
    userId?: string;
    eventType?: string;
  }) => request<UserActivityResponse>(`/api/admin/activity?${buildActivityQuery(opts)}`),

  searchUsers: (q: string, limit = 20) =>
    request<ApiUserSearchItem[]>(`/api/admin/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getStats: () => request<AdminStatsResponse>('/api/admin/stats'),

  getMetrics: () => request<AdminMetricsResponse>('/api/admin/metrics'),

  getQueues: () => request<Record<string, QueueInfo>>('/api/admin/queues'),
};
