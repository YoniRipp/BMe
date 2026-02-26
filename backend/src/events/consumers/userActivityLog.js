/**
 * Consumer: on any event (*), write a human-readable summary to user_activity_log.
 * Idempotent via UNIQUE constraint on event_id — safe to replay.
 */
import { getPool, isDbConfigured } from '../../db/index.js';
import { logger } from '../../lib/logger.js';

function summarise(event) {
  const p = event.payload ?? {};
  switch (event.type) {
    case 'auth.UserRegistered':
      return 'Registered an account';
    case 'auth.UserLoggedIn':
      return `Logged in via ${p.method ?? 'unknown'}`;
    case 'money.TransactionCreated':
      return `Created a ${p.type ?? 'transaction'} of ${p.amount ?? '?'}`;
    case 'money.TransactionUpdated':
      return `Updated transaction ${p.id ?? '?'}`;
    case 'money.TransactionDeleted':
      return `Deleted transaction ${p.id ?? '?'}`;
    case 'body.WorkoutCreated':
      return `Logged workout: ${p.name ?? p.id ?? '?'}`;
    case 'body.WorkoutUpdated':
      return `Updated workout: ${p.name ?? p.id ?? '?'}`;
    case 'body.WorkoutDeleted':
      return `Deleted workout ${p.id ?? '?'}`;
    case 'energy.FoodEntryCreated':
      return `Logged food entry: ${p.name ?? p.foodName ?? p.id ?? '?'}`;
    case 'energy.FoodEntryUpdated':
      return `Updated food entry ${p.id ?? '?'}`;
    case 'energy.FoodEntryDeleted':
      return `Deleted food entry ${p.id ?? '?'}`;
    case 'energy.CheckInCreated':
      return 'Completed daily check-in';
    case 'energy.CheckInUpdated':
      return 'Updated daily check-in';
    case 'schedule.ScheduleItemAdded':
      return `Added schedule item: ${p.title ?? p.id ?? '?'}`;
    case 'schedule.ScheduleBatchAdded':
      return `Added ${Array.isArray(p.items) ? p.items.length : '?'} schedule items`;
    case 'schedule.ScheduleItemUpdated':
      return `Updated schedule item: ${p.title ?? p.id ?? '?'}`;
    case 'schedule.ScheduleItemDeleted':
      return `Deleted schedule item ${p.id ?? '?'}`;
    case 'goals.GoalCreated':
      return `Created goal: ${p.title ?? p.name ?? p.id ?? '?'}`;
    case 'goals.GoalUpdated':
      return `Updated goal: ${p.title ?? p.name ?? p.id ?? '?'}`;
    case 'goals.GoalDeleted':
      return `Deleted goal ${p.id ?? '?'}`;
    default:
      return event.type;
  }
}

export function registerUserActivityLogConsumer(subscribe) {
  subscribe('*', async (event) => {
    const userId = event.metadata?.userId;
    if (!userId || !event.eventId) return;
    if (!isDbConfigured()) return;

    const summary = summarise(event);
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO user_activity_log (user_id, event_type, event_id, summary, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (event_id) DO NOTHING`,
        [
          userId,
          event.type,
          event.eventId,
          summary,
          event.payload ? JSON.stringify(event.payload) : null,
          event.metadata?.timestamp ? new Date(event.metadata.timestamp) : new Date(),
        ]
      );
    } catch (err) {
      logger.error({ err, eventId: event.eventId, eventType: event.type }, 'userActivityLog consumer failed');
    }
  });
}
