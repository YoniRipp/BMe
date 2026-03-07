/**
 * Health sync service — business logic for syncing data from Apple Health / Health Connect.
 */
import { getPool } from '../db/pool.js';
import * as healthSyncModel from '../models/healthSync.js';
import { publishEvent } from '../events/publish.js';
import type {
  HealthSyncPayload,
  HealthSyncResult,
  HealthSyncState,
  HealthMetric,
  HealthPlatform,
  HealthMetricType,
  WorkoutType,
  PaginationParams,
} from '../types/domain.js';
import type { HealthSyncBody, HealthMetricsQuery } from '../schemas/routeSchemas.js';

// ─── Workout type mapping ──────────────────────────────────

const CARDIO_TYPES = new Set([
  'running', 'walking', 'hiking', 'cycling', 'swimming', 'rowing',
  'elliptical', 'stair_climbing', 'stairclimbing', 'jump_rope',
  'cross_country_skiing', 'skating', 'surfing', 'dance',
  'aerobics', 'cardio', 'crossfit',
]);

const STRENGTH_TYPES = new Set([
  'weight_training', 'weighttraining', 'functional_training',
  'high_intensity_interval_training', 'hiit', 'strength',
  'traditional_strength_training', 'core_training',
]);

const FLEXIBILITY_TYPES = new Set([
  'yoga', 'pilates', 'stretching', 'tai_chi', 'flexibility',
  'barre', 'cooldown', 'warmup',
]);

const SPORTS_TYPES = new Set([
  'soccer', 'basketball', 'tennis', 'badminton', 'baseball',
  'cricket', 'golf', 'volleyball', 'rugby', 'handball',
  'table_tennis', 'squash', 'racquetball', 'martial_arts',
  'boxing', 'wrestling', 'fencing', 'lacrosse', 'hockey',
  'football', 'softball',
]);

function mapWorkoutType(platformType: string): WorkoutType {
  const normalized = platformType.toLowerCase().replace(/[\s-]/g, '_');
  if (STRENGTH_TYPES.has(normalized)) return 'strength';
  if (FLEXIBILITY_TYPES.has(normalized)) return 'flexibility';
  if (SPORTS_TYPES.has(normalized)) return 'sports';
  if (CARDIO_TYPES.has(normalized)) return 'cardio';
  return 'cardio'; // default
}

// ─── Sync State ────────────────────────────────────────────

export async function getSyncState(userId: string): Promise<HealthSyncState[]> {
  return healthSyncModel.findSyncStateByUserId(userId);
}

export async function updateSyncState(
  userId: string,
  platform: HealthPlatform,
  dataType: string,
  enabled: boolean,
): Promise<HealthSyncState> {
  return healthSyncModel.upsertSyncState(userId, platform, dataType, enabled);
}

// ─── Metrics ───────────────────────────────────────────────

export async function getMetrics(
  userId: string,
  query: HealthMetricsQuery,
): Promise<{ data: HealthMetric[]; total: number }> {
  return healthSyncModel.findMetrics(
    userId,
    { startDate: query.startDate, endDate: query.endDate, metricType: query.metricType },
    { limit: query.limit, offset: query.offset },
  );
}

// ─── Main sync ─────────────────────────────────────────────

export async function sync(userId: string, body: HealthSyncBody): Promise<HealthSyncResult> {
  const { platform, syncedAt } = body;
  const result: HealthSyncResult = {
    workoutsCreated: 0,
    workoutsUpdated: 0,
    sleepSynced: 0,
    nutritionSynced: 0,
    metricsSynced: 0,
  };

  // Sync workouts
  if (body.workouts?.length) {
    const bodyPool = getPool('body');
    for (const w of body.workouts) {
      const existingId = await healthSyncModel.findWorkoutByExternalId(userId, w.externalId, platform, bodyPool);
      const mappedType = mapWorkoutType(w.type);

      if (existingId) {
        await bodyPool.query(
          `UPDATE workouts SET date = $1::date, title = $2, type = $3, duration_minutes = $4,
           exercises = $5::jsonb, updated_at = now()
           WHERE id = $6 AND user_id = $7`,
          [w.date, w.title, mappedType, w.durationMinutes, JSON.stringify(w.exercises ?? []), existingId, userId],
        );
        result.workoutsUpdated++;
      } else {
        const insertResult = await bodyPool.query(
          `INSERT INTO workouts (user_id, date, title, type, duration_minutes, exercises, source, external_id)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
           RETURNING id`,
          [userId, w.date, w.title, mappedType, w.durationMinutes, JSON.stringify(w.exercises ?? []), platform, w.externalId],
        );
        result.workoutsCreated++;
        await publishEvent('body.WorkoutCreated', {
          id: insertResult.rows[0].id,
          date: w.date,
          title: w.title,
          type: mappedType,
          durationMinutes: w.durationMinutes,
          source: platform,
        }, userId);
      }
    }
    await healthSyncModel.updateLastSyncedAt(userId, platform, 'workouts', syncedAt);
  }

  // Sync sleep
  if (body.sleep?.length) {
    const energyPool = getPool('energy');
    for (const s of body.sleep) {
      const existingId = await healthSyncModel.findCheckInByExternalId(userId, s.externalId, platform, energyPool);

      if (existingId) {
        await energyPool.query(
          'UPDATE daily_check_ins SET sleep_hours = $1, date = $2::date WHERE id = $3 AND user_id = $4',
          [s.sleepHours, s.date, existingId, userId],
        );
      } else {
        await energyPool.query(
          `INSERT INTO daily_check_ins (user_id, date, sleep_hours, source, external_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, s.date, s.sleepHours, platform, s.externalId],
        );
      }
      result.sleepSynced++;
    }
    await healthSyncModel.updateLastSyncedAt(userId, platform, 'sleep', syncedAt);
  }

  // Sync nutrition
  if (body.nutrition?.length) {
    const energyPool = getPool('energy');
    for (const n of body.nutrition) {
      const existingId = await healthSyncModel.findFoodEntryByExternalId(userId, n.externalId, platform, energyPool);

      if (existingId) {
        await energyPool.query(
          `UPDATE food_entries SET name = $1, calories = $2, protein = $3, carbs = $4, fats = $5, updated_at = now()
           WHERE id = $6 AND user_id = $7`,
          [n.name, n.calories, n.protein ?? 0, n.carbs ?? 0, n.fats ?? 0, existingId, userId],
        );
      } else {
        await energyPool.query(
          `INSERT INTO food_entries (user_id, date, name, calories, protein, carbs, fats, source, external_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, n.date, n.name, n.calories, n.protein ?? 0, n.carbs ?? 0, n.fats ?? 0, platform, n.externalId],
        );
        await publishEvent('energy.FoodEntryCreated', {
          date: n.date,
          name: n.name,
          calories: n.calories,
          source: platform,
        }, userId);
      }
      result.nutritionSynced++;
    }
    await healthSyncModel.updateLastSyncedAt(userId, platform, 'nutrition', syncedAt);
  }

  // Sync metrics (steps, heart rate, calories)
  if (body.metrics?.length) {
    for (const m of body.metrics) {
      const metricsToSync: Array<{ type: HealthMetricType; value: number }> = [];
      if (m.steps != null) metricsToSync.push({ type: 'steps', value: m.steps });
      if (m.activeCalories != null) metricsToSync.push({ type: 'active_calories', value: m.activeCalories });
      if (m.heartRateAvg != null) metricsToSync.push({ type: 'heart_rate_avg', value: m.heartRateAvg });
      if (m.heartRateResting != null) metricsToSync.push({ type: 'heart_rate_resting', value: m.heartRateResting });

      for (const metric of metricsToSync) {
        await healthSyncModel.upsertMetric(userId, m.date, metric.type, metric.value, platform);
        result.metricsSynced++;
      }
    }
    await healthSyncModel.updateLastSyncedAt(userId, platform, 'metrics', syncedAt);
  }

  await publishEvent('health.SyncCompleted', {
    platform,
    ...result,
  }, userId);

  return result;
}
