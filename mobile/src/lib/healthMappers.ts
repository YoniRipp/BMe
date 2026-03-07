/**
 * Maps health platform data (HealthKit / Health Connect) to BeMe sync payload format.
 * Used by the React Native/Expo mobile app.
 */
import type { HealthSyncPayload } from '../core/api/health';

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
}

export interface PlatformDailyMetrics {
  date: string | Date;
  steps?: number;
  activeCalories?: number;
  heartRateAvg?: number;
  heartRateResting?: number;
}

function toDateString(d: string | Date): string {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function durationMinutes(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / 60000);
}

function sleepHours(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round(((e - s) / 3600000) * 10) / 10;
}

function formatWorkoutTitle(workoutType: string): string {
  return workoutType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildSyncPayload(
  platform: HealthPlatform,
  data: {
    workouts?: PlatformWorkout[];
    sleep?: PlatformSleepSession[];
    metrics?: PlatformDailyMetrics[];
  },
): HealthSyncPayload {
  return {
    platform,
    workouts: data.workouts?.map((w) => ({
      externalId: w.id,
      date: toDateString(w.startDate),
      title: formatWorkoutTitle(w.workoutType),
      type: w.workoutType,
      durationMinutes: durationMinutes(w.startDate, w.endDate),
      caloriesBurned: w.totalEnergyBurned,
      heartRateAvg: w.averageHeartRate,
    })),
    sleep: data.sleep?.map((s) => ({
      externalId: s.id,
      date: toDateString(s.startDate),
      sleepHours: sleepHours(s.startDate, s.endDate),
    })),
    metrics: data.metrics?.map((m) => ({
      date: toDateString(m.date),
      steps: m.steps,
      activeCalories: m.activeCalories,
      heartRateAvg: m.heartRateAvg,
      heartRateResting: m.heartRateResting,
    })),
    syncedAt: new Date().toISOString(),
  };
}
