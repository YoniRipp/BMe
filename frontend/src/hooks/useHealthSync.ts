/**
 * Health sync hook — manages syncing data from Apple Health / Google Health Connect.
 * Uses Capacitor plugins when running on native, no-ops on web.
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi, type HealthSyncState, type HealthSyncResult } from '@/core/api/health';
import { buildSyncPayload, type HealthPlatform, type PlatformWorkout, type PlatformSleepSession, type PlatformNutrition, type PlatformDailyMetrics } from '@/lib/healthMappers';
import { queryKeys } from '@/lib/queryClient';

const HEALTH_SYNC_KEYS = {
  syncState: ['healthSyncState'] as const,
  metrics: (params?: Record<string, string>) => ['healthMetrics', params] as const,
};

function getPlatform(): HealthPlatform | null {
  try {
    // Capacitor platform detection
    const cap = (window as Record<string, unknown>).Capacitor as { getPlatform?: () => string } | undefined;
    if (cap?.getPlatform) {
      const p = cap.getPlatform();
      if (p === 'ios') return 'apple_health';
      if (p === 'android') return 'health_connect';
    }
  } catch {
    // not on native
  }
  return null;
}

export function useHealthSync() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<HealthSyncResult | null>(null);
  const platform = getPlatform();
  const isNative = platform !== null;

  const {
    data: syncState = [],
    isLoading: syncStateLoading,
  } = useQuery({
    queryKey: HEALTH_SYNC_KEYS.syncState,
    queryFn: () => healthApi.getSyncState(),
    enabled: isNative,
    staleTime: 5 * 60 * 1000,
  });

  const updateStateMutation = useMutation({
    mutationFn: (body: { platform: string; dataType: string; enabled: boolean }) =>
      healthApi.updateSyncState(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_SYNC_KEYS.syncState });
    },
  });

  const toggleDataType = useCallback(
    (dataType: string, enabled: boolean) => {
      if (!platform) return;
      updateStateMutation.mutate({ platform, dataType, enabled });
    },
    [platform, updateStateMutation],
  );

  const syncNow = useCallback(async () => {
    if (!platform || syncing) return;

    setSyncing(true);
    try {
      // Read data from health platform plugins
      // These are no-ops if the plugins aren't installed
      const workouts: PlatformWorkout[] = [];
      const sleep: PlatformSleepSession[] = [];
      const nutrition: PlatformNutrition[] = [];
      const metrics: PlatformDailyMetrics[] = [];

      // Find last sync time to only fetch new data
      const lastSync = syncState.find(
        (s: HealthSyncState) => s.platform === platform && s.dataType === 'workouts',
      )?.lastSyncedAt;
      const since = lastSync ? new Date(lastSync) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days default

      try {
        if (platform === 'apple_health') {
          // HealthKit plugin - these calls require capacitor-apple-healthkit to be installed
          const hk = await import('capacitor-apple-healthkit').catch(() => null);
          if (hk) {
            const startDate = since.toISOString();
            const endDate = new Date().toISOString();

            // Read workouts
            try {
              const wData = await hk.CapacitorHealthkit.queryHKitSampleType({
                sampleName: 'HKWorkoutType',
                startDate,
                endDate,
                limit: 100,
              });
              if (wData?.resultData) {
                workouts.push(...wData.resultData.map((w: Record<string, unknown>) => ({
                  id: (w.uuid as string) ?? String(w.startDate),
                  startDate: w.startDate as string,
                  endDate: w.endDate as string,
                  workoutType: (w.workoutActivityType as string) ?? 'other',
                  totalEnergyBurned: w.totalEnergyBurned as number | undefined,
                })));
              }
            } catch { /* permission not granted or plugin not available */ }

            // Read sleep
            try {
              const sData = await hk.CapacitorHealthkit.queryHKitSampleType({
                sampleName: 'HKCategoryTypeIdentifierSleepAnalysis',
                startDate,
                endDate,
                limit: 100,
              });
              if (sData?.resultData) {
                sleep.push(...sData.resultData.map((s: Record<string, unknown>) => ({
                  id: (s.uuid as string) ?? String(s.startDate),
                  startDate: s.startDate as string,
                  endDate: s.endDate as string,
                })));
              }
            } catch { /* permission not granted or plugin not available */ }

            // Read steps
            try {
              const stData = await hk.CapacitorHealthkit.queryHKitSampleType({
                sampleName: 'HKQuantityTypeIdentifierStepCount',
                startDate,
                endDate,
                limit: 100,
              });
              if (stData?.resultData) {
                const byDate = new Map<string, number>();
                for (const s of stData.resultData) {
                  const date = new Date(s.startDate as string).toISOString().slice(0, 10);
                  byDate.set(date, (byDate.get(date) ?? 0) + Number(s.value ?? 0));
                }
                for (const [date, steps] of byDate) {
                  metrics.push({ date, steps });
                }
              }
            } catch { /* permission not granted or plugin not available */ }
          }
        } else if (platform === 'health_connect') {
          // Health Connect plugin
          const hc = await import('@nicepkg/capacitor-health-connect').catch(() => null);
          if (hc) {
            const startTime = since.toISOString();
            const endTime = new Date().toISOString();

            // Read exercise sessions
            try {
              const sessions = await hc.HealthConnect.readRecords({
                type: 'ExerciseSession',
                timeRangeFilter: { startTime, endTime },
              });
              if (sessions?.records) {
                workouts.push(...sessions.records.map((r: Record<string, unknown>) => ({
                  id: (r.metadata as Record<string, unknown>)?.id as string ?? String(r.startTime),
                  startDate: r.startTime as string,
                  endDate: r.endTime as string,
                  workoutType: (r.exerciseType as string) ?? 'other',
                })));
              }
            } catch { /* permission not granted or plugin not available */ }

            // Read sleep sessions
            try {
              const sleepData = await hc.HealthConnect.readRecords({
                type: 'SleepSession',
                timeRangeFilter: { startTime, endTime },
              });
              if (sleepData?.records) {
                sleep.push(...sleepData.records.map((r: Record<string, unknown>) => ({
                  id: (r.metadata as Record<string, unknown>)?.id as string ?? String(r.startTime),
                  startDate: r.startTime as string,
                  endDate: r.endTime as string,
                })));
              }
            } catch { /* permission not granted or plugin not available */ }

            // Read steps
            try {
              const stepsData = await hc.HealthConnect.readRecords({
                type: 'Steps',
                timeRangeFilter: { startTime, endTime },
              });
              if (stepsData?.records) {
                const byDate = new Map<string, number>();
                for (const r of stepsData.records) {
                  const date = new Date(r.startTime as string).toISOString().slice(0, 10);
                  byDate.set(date, (byDate.get(date) ?? 0) + Number((r as Record<string, unknown>).count ?? 0));
                }
                for (const [date, steps] of byDate) {
                  metrics.push({ date, steps });
                }
              }
            } catch { /* permission not granted or plugin not available */ }
          }
        }
      } catch {
        // Plugin not available
      }

      // Build and send sync payload
      const payload = buildSyncPayload(platform, { workouts, sleep, nutrition, metrics });

      // Only send if there's data to sync
      const hasData = (payload.workouts?.length ?? 0) > 0
        || (payload.sleep?.length ?? 0) > 0
        || (payload.nutrition?.length ?? 0) > 0
        || (payload.metrics?.length ?? 0) > 0;

      if (hasData) {
        const result = await healthApi.sync(payload);
        setLastResult(result);

        // Invalidate related queries so dashboard updates
        queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
        queryClient.invalidateQueries({ queryKey: queryKeys.checkIns });
        queryClient.invalidateQueries({ queryKey: queryKeys.foodEntries });
        queryClient.invalidateQueries({ queryKey: HEALTH_SYNC_KEYS.syncState });
      } else {
        setLastResult({ workoutsCreated: 0, workoutsUpdated: 0, sleepSynced: 0, nutritionSynced: 0, metricsSynced: 0 });
      }
    } finally {
      setSyncing(false);
    }
  }, [platform, syncing, syncState, queryClient]);

  return {
    platform,
    isNative,
    syncing,
    syncState,
    syncStateLoading,
    lastResult,
    syncNow,
    toggleDataType,
  };
}
