/**
 * Workout model — data access only.
 */
import { getPool } from '../db/pool.js';

function rowToWorkout(row) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    type: row.type,
    durationMinutes: row.duration_minutes,
    exercises: row.exercises ?? [],
    notes: row.notes ?? undefined,
  };
}

export async function findByUserId(userId) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [userId]
  );
  return result.rows.map(rowToWorkout);
}

export async function create(params) {
  const pool = getPool();
  const { userId, date, title, type, durationMinutes, exercises, notes } = params;
  const d = date ? new Date(date) : new Date();
  const ex = Array.isArray(exercises) ? exercises : [];
  const result = await pool.query(
    `INSERT INTO workouts (user_id, date, title, type, duration_minutes, exercises, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, d.toISOString().slice(0, 10), title.trim(), type, durationMinutes, JSON.stringify(ex), notes ?? null]
  );
  return rowToWorkout(result.rows[0]);
}

export async function update(id, userId, updates) {
  const pool = getPool();
  const entries = [];
  const values = [];
  let i = 1;
  if (updates.date !== undefined) { entries.push(`date = $${i}::date`); values.push(updates.date); i++; }
  if (updates.title !== undefined) { entries.push(`title = $${i}`); values.push(typeof updates.title === 'string' ? updates.title.trim() : updates.title); i++; }
  if (updates.type !== undefined) { entries.push(`type = $${i}`); values.push(updates.type); i++; }
  if (updates.durationMinutes !== undefined) { entries.push(`duration_minutes = $${i}`); values.push(updates.durationMinutes); i++; }
  if (updates.exercises !== undefined) { entries.push(`exercises = $${i}::jsonb`); values.push(JSON.stringify(Array.isArray(updates.exercises) ? updates.exercises : [])); i++; }
  if (updates.notes !== undefined) { entries.push(`notes = $${i}`); values.push(updates.notes ?? null); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE workouts SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
    values
  );
  return result.rowCount > 0 ? rowToWorkout(result.rows[0]) : null;
}

export async function deleteById(id, userId) {
  const pool = getPool();
  const result = await pool.query('DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}
