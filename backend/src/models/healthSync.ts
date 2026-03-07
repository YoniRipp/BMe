/**
 * Health sync model — data access for health_sync_state and health_metrics tables.
 */
import pg from 'pg';
import { getPool } from '../db/pool.js';
import type { HealthSyncState, HealthMetric, HealthPlatform, HealthMetricType, PaginationParams } from '../types/domain.js';

// ─── Health Sync State ─────────────────────────────────────

function rowToSyncState(row: Record<string, unknown>): HealthSyncState {
  return {
    id: row.id as string,
    platform: row.platform as HealthPlatform,
    dataType: row.data_type as string,
    lastSyncedAt: (row.last_synced_at as Date).toISOString(),
    enabled: row.enabled as boolean,
  };
}

export async function findSyncStateByUserId(userId: string, client?: pg.Pool | pg.PoolClient): Promise<HealthSyncState[]> {
  const db = client ?? getPool();
  const result = await db.query(
    'SELECT id, platform, data_type, last_synced_at, enabled FROM health_sync_state WHERE user_id = $1 ORDER BY platform, data_type',
    [userId],
  );
  return result.rows.map(rowToSyncState);
}

export async function upsertSyncState(
  userId: string,
  platform: HealthPlatform,
  dataType: string,
  enabled: boolean,
  client?: pg.Pool | pg.PoolClient,
): Promise<HealthSyncState> {
  const db = client ?? getPool();
  const result = await db.query(
    `INSERT INTO health_sync_state (user_id, platform, data_type, enabled)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, platform, data_type)
     DO UPDATE SET enabled = $4
     RETURNING id, platform, data_type, last_synced_at, enabled`,
    [userId, platform, dataType, enabled],
  );
  return rowToSyncState(result.rows[0]);
}

export async function updateLastSyncedAt(
  userId: string,
  platform: HealthPlatform,
  dataType: string,
  syncedAt: string,
  client?: pg.Pool | pg.PoolClient,
): Promise<void> {
  const db = client ?? getPool();
  await db.query(
    `INSERT INTO health_sync_state (user_id, platform, data_type, last_synced_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, platform, data_type)
     DO UPDATE SET last_synced_at = $4`,
    [userId, platform, dataType, syncedAt],
  );
}

// ─── Health Metrics ────────────────────────────────────────

function rowToMetric(row: Record<string, unknown>): HealthMetric {
  return {
    id: row.id as string,
    date: String(row.date),
    metricType: row.metric_type as HealthMetricType,
    value: Number(row.value),
    source: row.source as string,
  };
}

export async function upsertMetric(
  userId: string,
  date: string,
  metricType: HealthMetricType,
  value: number,
  source: string,
  externalId?: string,
  client?: pg.Pool | pg.PoolClient,
): Promise<HealthMetric> {
  const db = client ?? getPool();
  const result = await db.query(
    `INSERT INTO health_metrics (user_id, date, metric_type, value, source, external_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, date, metric_type, source)
     DO UPDATE SET value = $4, external_id = $6
     RETURNING id, date, metric_type, value, source`,
    [userId, date, metricType, value, source, externalId ?? null],
  );
  return rowToMetric(result.rows[0]);
}

export async function findMetrics(
  userId: string,
  filters: { startDate?: string; endDate?: string; metricType?: HealthMetricType },
  pagination?: PaginationParams,
  client?: pg.Pool | pg.PoolClient,
): Promise<{ data: HealthMetric[]; total: number }> {
  const db = client ?? getPool();
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let paramIdx = 2;

  if (filters.startDate) {
    conditions.push(`date >= $${paramIdx}::date`);
    params.push(filters.startDate);
    paramIdx++;
  }
  if (filters.endDate) {
    conditions.push(`date <= $${paramIdx}::date`);
    params.push(filters.endDate);
    paramIdx++;
  }
  if (filters.metricType) {
    conditions.push(`metric_type = $${paramIdx}`);
    params.push(filters.metricType);
    paramIdx++;
  }

  const where = conditions.join(' AND ');
  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM health_metrics WHERE ${where}`, params);
  const total = countResult.rows[0].total;

  let sql = `SELECT id, date, metric_type, value, source FROM health_metrics WHERE ${where} ORDER BY date DESC`;

  if (pagination) {
    sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(pagination.limit, pagination.offset);
  }

  const result = await db.query(sql, params);
  return { data: result.rows.map(rowToMetric), total };
}

// ─── Synced record helpers (workouts, food, sleep) ─────────

export async function findWorkoutByExternalId(
  userId: string,
  externalId: string,
  source: string,
  client?: pg.Pool | pg.PoolClient,
): Promise<string | null> {
  const db = client ?? getPool('body');
  const result = await db.query(
    'SELECT id FROM workouts WHERE user_id = $1 AND external_id = $2 AND source = $3 LIMIT 1',
    [userId, externalId, source],
  );
  return result.rows.length > 0 ? (result.rows[0].id as string) : null;
}

export async function findFoodEntryByExternalId(
  userId: string,
  externalId: string,
  source: string,
  client?: pg.Pool | pg.PoolClient,
): Promise<string | null> {
  const db = client ?? getPool('energy');
  const result = await db.query(
    'SELECT id FROM food_entries WHERE user_id = $1 AND external_id = $2 AND source = $3 LIMIT 1',
    [userId, externalId, source],
  );
  return result.rows.length > 0 ? (result.rows[0].id as string) : null;
}

export async function findCheckInByExternalId(
  userId: string,
  externalId: string,
  source: string,
  client?: pg.Pool | pg.PoolClient,
): Promise<string | null> {
  const db = client ?? getPool('energy');
  const result = await db.query(
    'SELECT id FROM daily_check_ins WHERE user_id = $1 AND external_id = $2 AND source = $3 LIMIT 1',
    [userId, externalId, source],
  );
  return result.rows.length > 0 ? (result.rows[0].id as string) : null;
}
