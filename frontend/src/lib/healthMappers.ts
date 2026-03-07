/**
 * Maps health platform data (HealthKit / Health Connect) to BeMe sync payload format.
 * Platform-specific plugins return different shapes; these mappers normalize them.
 */
import type { HealthSyncPayload } from '@/core/api/health';
import { toLocalDateString } from '@/lib/dateRanges';

export type HealthPlatform = 'apple_health' | 'health_connect';

export interface PlatformWorkout {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  workoutType: string;
  totalEnergyBurned?: number;
  averageHeartRate?: number;
}

export interface PlatformSleepSession {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  stages?: { deep: number; light: number; rem: number; awake: number };
}

export interface PlatformNutrition {
  id: string;
  date: string | Date;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface PlatformDailyMetrics {
  date: string | Date;
  steps?: number;
  activeCalories?: number;
  heartRateAvg?: number;
  heartRateResting?: number;
}

function durationMinutes(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / 60000);
}

function dateStr(d: string | Date): string {
  return toLocalDateString(new Date(d));
}

function sleepHours(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round(((e - s) / 3600000) * 10) / 10;
}

export function buildSyncPayload(
  platform: HealthPlatform,
  data: {
    workouts?: PlatformWorkout[];
    sleep?: PlatformSleepSession[];
    nutrition?: PlatformNutrition[];
    metrics?: PlatformDailyMetrics[];
  },
): HealthSyncPayload {
  return {
    platform,
    workouts: data.workouts?.map((w) => ({
      externalId: w.id,
      date: dateStr(w.startDate),
      title: formatWorkoutTitle(w.workoutType),
      type: w.workoutType,
      durationMinutes: durationMinutes(w.startDate, w.endDate),
      caloriesBurned: w.totalEnergyBurned,
      heartRateAvg: w.averageHeartRate,
    })),
    sleep: data.sleep?.map((s) => ({
      externalId: s.id,
      date: dateStr(s.startDate),
      sleepHours: sleepHours(s.startDate, s.endDate),
      stages: s.stages,
    })),
    nutrition: data.nutrition?.map((n) => ({
      externalId: n.id,
      date: dateStr(n.date),
      name: n.name ?? 'Food entry',
      calories: n.calories ?? 0,
      protein: n.protein,
      carbs: n.carbs,
      fats: n.fats,
    })),
    metrics: data.metrics?.map((m) => ({
      date: dateStr(m.date),
      steps: m.steps,
      activeCalories: m.activeCalories,
      heartRateAvg: m.heartRateAvg,
      heartRateResting: m.heartRateResting,
    })),
    syncedAt: new Date().toISOString(),
  };
}

function formatWorkoutTitle(workoutType: string): string {
  return workoutType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
