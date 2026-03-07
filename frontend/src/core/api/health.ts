import { request } from './client';
import type { PaginatedResponse } from '@/types/api';

export interface HealthSyncState {
  id: string;
  platform: 'apple_health' | 'health_connect';
  dataType: string;
  lastSyncedAt: string;
  enabled: boolean;
}

export interface HealthMetric {
  id: string;
  date: string;
  metricType: string;
  value: number;
  source: string;
}

export interface HealthSyncPayload {
  platform: 'apple_health' | 'health_connect';
  workouts?: Array<{
    externalId: string;
    date: string;
    title: string;
    type: string;
    durationMinutes: number;
    caloriesBurned?: number;
    heartRateAvg?: number;
  }>;
  sleep?: Array<{
    externalId: string;
    date: string;
    sleepHours: number;
    stages?: { deep: number; light: number; rem: number; awake: number };
  }>;
  nutrition?: Array<{
    externalId: string;
    date: string;
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }>;
  metrics?: Array<{
    date: string;
    steps?: number;
    activeCalories?: number;
    heartRateAvg?: number;
    heartRateResting?: number;
  }>;
  syncedAt: string;
}

export interface HealthSyncResult {
  workoutsCreated: number;
  workoutsUpdated: number;
  sleepSynced: number;
  nutritionSynced: number;
  metricsSynced: number;
}

export const healthApi = {
  sync: (payload: HealthSyncPayload) =>
    request<HealthSyncResult>('/api/health/sync', { method: 'POST', body: payload }),

  getSyncState: () =>
    request<HealthSyncState[]>('/api/health/sync-state'),

  updateSyncState: (body: { platform: string; dataType: string; enabled: boolean }) =>
    request<HealthSyncState>('/api/health/sync-state', { method: 'PUT', body }),

  getMetrics: (params?: { startDate?: string; endDate?: string; metricType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.metricType) searchParams.set('metricType', params.metricType);
    const qs = searchParams.toString();
    return request<PaginatedResponse<HealthMetric>>(`/api/health/metrics${qs ? `?${qs}` : ''}`);
  },
};
