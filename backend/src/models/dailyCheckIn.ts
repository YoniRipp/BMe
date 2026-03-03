/**
 * Daily check-in model — data access only.
 */
import { getPool } from '../db/pool.js';

type QueryParam = string | number | boolean | null | undefined;

function rowToCheckIn(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: row.date,
    sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : undefined,
  };
}

export async function findByUserId(userId: string) {
  const pool = getPool('energy');
  const result = await pool.query(
    'SELECT id, date, sleep_hours FROM daily_check_ins WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [userId]
  );
  return result.rows.map(rowToCheckIn);
}

export async function create(params: Record<string, unknown>) {
  const pool = getPool('energy');
  const { userId, date, sleepHours } = params;
  const d = date ? new Date(date as string) : new Date();
  const result = await pool.query(
    `INSERT INTO daily_check_ins (user_id, date, sleep_hours)
     VALUES ($1, $2, $3)
     RETURNING id, date, sleep_hours`,
    [userId, d.toISOString().slice(0, 10), sleepHours]
  );
  return rowToCheckIn(result.rows[0]);
}

export async function update(id: string, userId: string, updates: Record<string, unknown>) {
  const pool = getPool('energy');
  const entries: string[] = [];
  const values: QueryParam[] = [];
  let i = 1;
  if (updates.date !== undefined) { entries.push(`date = $${i}::date`); values.push(updates.date as QueryParam); i++; }
  if (updates.sleepHours !== undefined) { entries.push(`sleep_hours = $${i}`); values.push(updates.sleepHours as QueryParam); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE daily_check_ins SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, date, sleep_hours`,
    values
  );
  return (result.rowCount ?? 0) > 0 ? rowToCheckIn(result.rows[0]) : null;
}

export async function deleteById(id: string, userId: string) {
  const pool = getPool('energy');
  const result = await pool.query('DELETE FROM daily_check_ins WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
