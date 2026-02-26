/**
 * Goal model — data access only.
 */
import { getPool } from '../db/pool.js';

function rowToGoal(row) {
  return {
    id: row.id,
    type: row.type,
    target: Number(row.target),
    period: row.period,
    createdAt: row.created_at,
  };
}

export async function findByUserId(userId) {
  const pool = getPool('goals');
  const result = await pool.query('SELECT id, type, target, period, created_at FROM goals WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
  return result.rows.map(rowToGoal);
}

export async function create(params) {
  const pool = getPool('goals');
  const { userId, type, target, period } = params;
  const result = await pool.query(
    'INSERT INTO goals (type, target, period, user_id) VALUES ($1, $2, $3, $4) RETURNING id, type, target, period, created_at',
    [type, target, period, userId]
  );
  return rowToGoal(result.rows[0]);
}

export async function update(id, userId, updates) {
  const pool = getPool('goals');
  const entries = [];
  const values = [];
  let i = 1;
  if (updates.type !== undefined) { entries.push(`type = $${i}`); values.push(updates.type); i++; }
  if (updates.target !== undefined) { entries.push(`target = $${i}`); values.push(updates.target); i++; }
  if (updates.period !== undefined) { entries.push(`period = $${i}`); values.push(updates.period); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE goals SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, type, target, period, created_at`,
    values
  );
  return result.rowCount > 0 ? rowToGoal(result.rows[0]) : null;
}

export async function deleteById(id, userId) {
  const pool = getPool('goals');
  const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return result.rowCount > 0;
}
