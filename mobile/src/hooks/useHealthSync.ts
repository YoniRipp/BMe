/**
 * Health sync hook for React Native/Expo.
 * Reads data from Apple Health (iOS) or Health Connect (Android) and syncs to backend.
 */
import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi, type HealthSyncState, type HealthSyncResult } from '../core/api/health';
import { buildSyncPayload, type HealthPlatform, type PlatformWorkout, type PlatformSleepSession, type PlatformDailyMetrics } from '../lib/healthMappers';

const HEALTH_SYNC_KEYS = {
  syncState: ['healthSyncState'] as const,
};

function getPlatform(): HealthPlatform | null {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'android') return 'health_connect';
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
      const workouts: PlatformWorkout[] = [];
      const sleep: PlatformSleepSession[] = [];
      const metrics: PlatformDailyMetrics[] = [];

      const lastSync = syncState.find(
        (s: HealthSyncState) => s.platform === platform && s.dataType === 'workouts',
      )?.lastSyncedAt;
      const since = lastSync ? new Date(lastSync) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      try {
        if (platform === 'apple_health') {
          // react-native-health (HealthKit)
          const AppleHealthKit = await import('react-native-health').then(m => m.default).catch(() => null);
          if (AppleHealthKit) {
            const permissions = {
              permissions: {
                read: [
                  AppleHealthKit.Constants?.Permissions?.Workout,
                  AppleHealthKit.Constants?.Permissions?.SleepAnalysis,
                  AppleHealthKit.Constants?.Permissions?.StepCount,
                  AppleHealthKit.Constants?.Permissions?.ActiveEnergyBurned,
                  AppleHealthKit.Constants?.Permissions?.HeartRate,
                ].filter(Boolean),
                write: [],
              },
            };

            await new Promise<void>((resolve, reject) => {
              AppleHealthKit.initHealthKit(permissions, (err: string) => {
                if (err) reject(new Error(err));
                else resolve();
              });
            });

            // Read workouts
            try {
              const wData = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
                AppleHealthKit.getSamples(
                  { startDate: since.toISOString(), endDate: new Date().toISOString(), type: 'Workout' },
                  (err: string, results: Array<Record<string, unknown>>) => {
                    if (err) reject(new Error(err));
                    else resolve(results || []);
                  },
                );
              });
              workouts.push(...wData.map((w: Record<string, unknown>) => ({
                id: (w.id as string) ?? String(w.startDate),
                startDate: w.startDate as string,
                endDate: w.endDate as string,
                workoutType: (w.activityName as string) ?? 'other',
                totalEnergyBurned: w.calories as number | undefined,
              })));
            } catch { /* not available */ }

            // Read sleep
            try {
              const sData = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
                AppleHealthKit.getSleepSamples(
                  { startDate: since.toISOString(), endDate: new Date().toISOString() },
                  (err: string, results: Array<Record<string, unknown>>) => {
                    if (err) reject(new Error(err));
                    else resolve(results || []);
                  },
                );
              });
              sleep.push(...sData.map((s: Record<string, unknown>) => ({
                id: (s.id as string) ?? String(s.startDate),
                startDate: s.startDate as string,
                endDate: s.endDate as string,
              })));
            } catch { /* not available */ }

            // Read steps
            try {
              const stData = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
                AppleHealthKit.getDailyStepCountSamples(
                  { startDate: since.toISOString(), endDate: new Date().toISOString() },
                  (err: string, results: Array<Record<string, unknown>>) => {
                    if (err) reject(new Error(err));
                    else resolve(results || []);
                  },
                );
              });
              metrics.push(...stData.map((s: Record<string, unknown>) => ({
                date: s.startDate as string,
                steps: s.value as number,
              })));
            } catch { /* not available */ }
          }
        } else if (platform === 'health_connect') {
          // react-native-health-connect
          const hc = await import('react-native-health-connect').catch(() => null);
          if (hc) {
            const initialized = await hc.initialize();
            if (!initialized) throw new Error('Health Connect not available');

            await hc.requestPermission([
              { accessType: 'read', recordType: 'ExerciseSession' },
              { accessType: 'read', recordType: 'SleepSession' },
              { accessType: 'read', recordType: 'Steps' },
              { accessType: 'read', recordType: 'HeartRate' },
            ]);

            // Read exercise sessions
            try {
              const sessions = await hc.readRecords('ExerciseSession', {
                timeRangeFilter: {
                  operator: 'between',
                  startTime: since.toISOString(),
                  endTime: new Date().toISOString(),
                },
              });
              workouts.push(...(sessions || []).map((r: Record<string, unknown>) => ({
                id: (r.metadata as Record<string, unknown>)?.id as string ?? String(r.startTime),
                startDate: r.startTime as string,
                endDate: r.endTime as string,
                workoutType: String(r.exerciseType ?? 'other'),
              })));
            } catch { /* not available */ }

            // Read sleep
            try {
              const sleepData = await hc.readRecords('SleepSession', {
                timeRangeFilter: {
                  operator: 'between',
                  startTime: since.toISOString(),
                  endTime: new Date().toISOString(),
                },
              });
              sleep.push(...(sleepData || []).map((r: Record<string, unknown>) => ({
                id: (r.metadata as Record<string, unknown>)?.id as string ?? String(r.startTime),
                startDate: r.startTime as string,
                endDate: r.endTime as string,
              })));
            } catch { /* not available */ }

            // Read steps
            try {
              const stepsData = await hc.readRecords('Steps', {
                timeRangeFilter: {
                  operator: 'between',
                  startTime: since.toISOString(),
                  endTime: new Date().toISOString(),
                },
              });
              const byDate = new Map<string, number>();
              for (const r of stepsData || []) {
                const date = new Date(r.startTime as string).toISOString().slice(0, 10);
                byDate.set(date, (byDate.get(date) ?? 0) + Number((r as Record<string, unknown>).count ?? 0));
              }
              for (const [date, steps] of byDate) {
                metrics.push({ date, steps });
              }
            } catch { /* not available */ }
          }
        }
      } catch {
        // Plugin not available or permissions denied
      }

      const payload = buildSyncPayload(platform, { workouts, sleep, metrics });

      const hasData = (payload.workouts?.length ?? 0) > 0
        || (payload.sleep?.length ?? 0) > 0
        || (payload.metrics?.length ?? 0) > 0;

      if (hasData) {
        const result = await healthApi.sync(payload);
        setLastResult(result);
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
        queryClient.invalidateQueries({ queryKey: ['checkIns'] });
        queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
        queryClient.invalidateQueries({ queryKey: HEALTH_SYNC_KEYS.syncState });
      } else {
        setLastResult({ workoutsCreated: 0, workoutsUpdated: 0, sleepSynced: 0, nutritionSynced: 0, metricsSynced: 0 });
      }
    } catch (error) {
      Alert.alert('Sync Error', error instanceof Error ? error.message : 'Failed to sync health data');
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
