/**
 * Stats aggregator consumer.
 *
 * Listens to domain events (TransactionCreated/Updated/Deleted,
 * WorkoutCreated/Deleted, FoodEntryCreated/Deleted, CheckIn logged)
 * and maintains a running daily stats row per user in user_daily_stats.
 *
 * This implements the CQRS read-model pattern:
 *   - Commands (writes) go through services → events are emitted
 *   - This consumer updates a denormalized read model used by the Insights page
 *
 * Pattern: cache-aside aggregation with idempotent upserts.
 */
import { getPool } from '../../db/pool.js';
import { logger } from '../../lib/logger.js';

/**
 * Upsert the daily stats row for a user on a given date.
 * Recalculates from source tables to ensure idempotency.
 */
async function recomputeDayStats(userId, date) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO user_daily_stats (user_id, date, total_calories, total_income, total_expenses, workout_count, sleep_hours)
       SELECT
         $1::uuid,
         $2::date,
         COALESCE((SELECT SUM(calories) FROM food_entries WHERE user_id = $1 AND date = $2::date), 0),
         COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND date = $2::date AND type = 'income'), 0),
         COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND date = $2::date AND type = 'expense'), 0),
         COALESCE((SELECT COUNT(*)::int FROM workouts WHERE user_id = $1 AND date = $2::date), 0),
         (SELECT sleep_hours FROM daily_check_ins WHERE user_id = $1 AND date = $2::date ORDER BY created_at DESC LIMIT 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         total_calories   = EXCLUDED.total_calories,
         total_income     = EXCLUDED.total_income,
         total_expenses   = EXCLUDED.total_expenses,
         workout_count    = EXCLUDED.workout_count,
         sleep_hours      = EXCLUDED.sleep_hours,
         updated_at       = now()`,
      [userId, date]
    );
  } catch (err) {
    logger.warn({ err, userId, date }, 'statsAggregator: recompute failed');
  }
}

/** Extract date from event payload (falls back to today). */
function eventDate(event) {
  const d = event.payload?.date ?? event.metadata?.timestamp?.slice(0, 10);
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0, 10);
}

/**
 * Register all stats aggregation consumers.
 * @param {(type: string, handler: Function) => void} subscribe
 */
export function registerStatsAggregatorConsumer(subscribe) {
  const handler = async (event) => {
    const userId = event.metadata?.userId;
    if (!userId) return;
    const date = eventDate(event);
    await recomputeDayStats(userId, date);
    logger.debug({ eventType: event.type, userId, date }, 'statsAggregator: day stats updated');
  };

  // Finance events
  subscribe('money.TransactionCreated', handler);
  subscribe('money.TransactionUpdated', handler);
  subscribe('money.TransactionDeleted', handler);

  // Fitness events
  subscribe('body.WorkoutCreated', handler);
  subscribe('body.WorkoutDeleted', handler);

  // Nutrition events
  subscribe('energy.FoodEntryCreated', handler);
  subscribe('energy.FoodEntryUpdated', handler);
  subscribe('energy.FoodEntryDeleted', handler);

  // Sleep events
  subscribe('energy.CheckInCreated', handler);
  subscribe('energy.CheckInUpdated', handler);
}
