import { getPool } from '../db/pool.js';

export async function getBusinessOverview() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS "totalUsers",
      (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS "newUsersThisWeek",
      (SELECT COUNT(*) FROM users WHERE subscription_status = 'pro')::int AS "proSubscribers",
      (SELECT COUNT(*) FROM users WHERE subscription_status IN ('canceled', 'expired'))::int AS "churned",
      (SELECT COUNT(*) FROM user_activity_log
        WHERE event_type LIKE 'voice.%'
        AND created_at >= date_trunc('month', CURRENT_DATE))::int AS "voiceCallsThisMonth",
      (SELECT COUNT(DISTINCT user_id) FROM user_activity_log
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS "weeklyActiveUsers"
  `);
  return result.rows[0];
}

export async function getUserGrowth(days = 30) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::int AS count
     FROM users
     WHERE created_at >= NOW() - $1::int * INTERVAL '1 day'
     GROUP BY 1
     ORDER BY 1`,
    [days]
  );
  return result.rows;
}

export async function getDailyVoiceCalls(days = 30) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT d.date::text, COALESCE(v.cnt, 0)::int AS calls
     FROM generate_series(
       (CURRENT_DATE - $1::int * INTERVAL '1 day')::date,
       CURRENT_DATE, '1 day'
     ) AS d(date)
     LEFT JOIN (
       SELECT created_at::date AS date, COUNT(*) AS cnt
       FROM user_activity_log
       WHERE event_type LIKE 'voice.%'
         AND created_at >= CURRENT_DATE - $1::int * INTERVAL '1 day'
       GROUP BY 1
     ) v ON v.date = d.date
     ORDER BY d.date`,
    [days]
  );
  return result.rows;
}

export async function getVoiceHeavyUsers(limit = 10) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT u.id, u.name, u.email,
            u.subscription_status AS "subscriptionStatus",
            COUNT(*)::int AS "voiceCalls",
            MAX(al.created_at) AS "lastActive"
     FROM user_activity_log al
     JOIN users u ON u.id = al.user_id
     WHERE al.event_type LIKE 'voice.%'
       AND al.created_at >= date_trunc('month', CURRENT_DATE)
     GROUP BY u.id, u.name, u.email, u.subscription_status
     ORDER BY COUNT(*) DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getRecentErrors(hours = 24) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS count,
       (SELECT message FROM app_logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 1) AS "lastErrorMessage"
     FROM app_logs
     WHERE level = 'error' AND created_at >= NOW() - $1::int * INTERVAL '1 hour'`,
    [hours]
  );
  return result.rows[0];
}
