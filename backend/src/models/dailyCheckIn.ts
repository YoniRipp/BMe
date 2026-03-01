/**
 * Daily check-in model — data access only.
 */
import { getPool } from '../db/pool.js';

function rowToCheckIn(row) {
  return {
    id: row.id,
    date: row.date,
    sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : undefined,
  };
}

export async function findByUserId(userId) {
  const pool = getPool('energy');
  const result = await pool.query(
    'SELECT id, date, sleep_hours FROM daily_check_ins WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [userId]
  );
  return result.rows.map(rowToCheckIn);
}

export async function create(params) {
  const pool = getPool('energy');
  const { userId, date, sleepHours } = params;
  const d = date ? new Date(date) : new Date();
  const result = await pool.query(
    `INSERT INTO daily_check_ins (user_id, date, sleep_hours)
     VALUES ($1, $2, $3)
     RETURNING id, date, sleep_hours`,
    [userId, d.toISOString().slice(0, 10), sleepHours]
  );
  return rowToCheckIn(result.rows[0]);
}

export async function update(id, userId, updates) {
  const pool = getPool('energy');
  const entries = [];
  const values = [];
  let i = 1;
  if (updates.date !== undefined) { entries.push(`date = $${i}::date`); values.push(updates.date); i++; }
  if (updates.sleepHours !== undefined) { entries.push(`sleep_hours = $${i}`); values.push(updates.sleepHours); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE daily_check_ins SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, date, sleep_hours`,
    values
  );
  return result.rowCount > 0 ? rowToCheckIn(result.rows[0]) : null;
}

export async function deleteById(id, userId) {
  const pool = getPool('energy');
  const result = await pool.query('DELETE FROM daily_check_ins WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}
