import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

const GOAL_TYPES = ['calories', 'workouts', 'savings'];
const GOAL_PERIODS = ['weekly', 'monthly', 'yearly'];

function rowToGoal(row) {
  return {
    id: row.id,
    type: row.type,
    target: Number(row.target),
    period: row.period,
    createdAt: row.created_at,
  };
}

export async function listGoals(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const pool = getPool();
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    res.json(result.rows.map(rowToGoal));
  } catch (e) {
    console.error('list goals error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list goals' });
  }
}

export async function addGoal(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { type, target, period } = req.body ?? {};
    if (!GOAL_TYPES.includes(type)) {
      return res.status(400).json({ error: 'type must be one of: ' + GOAL_TYPES.join(', ') });
    }
    if (!GOAL_PERIODS.includes(period)) {
      return res.status(400).json({ error: 'period must be one of: ' + GOAL_PERIODS.join(', ') });
    }
    if (typeof target !== 'number' || target < 0) {
      return res.status(400).json({ error: 'target must be a non-negative number' });
    }
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO goals (type, target, period, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, target, period, userId]
    );
    res.status(201).json(rowToGoal(result.rows[0]));
  } catch (e) {
    console.error('add goal error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add goal' });
  }
}

export async function updateGoal(req, res) {
  try {
    const { id } = req.params;
    const { type, target, period } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (type !== undefined) {
      if (!GOAL_TYPES.includes(type)) return res.status(400).json({ error: 'type must be one of: ' + GOAL_TYPES.join(', ') });
      updates.push(`type = $${i}`); values.push(type); i++;
    }
    if (period !== undefined) {
      if (!GOAL_PERIODS.includes(period)) return res.status(400).json({ error: 'period must be one of: ' + GOAL_PERIODS.join(', ') });
      updates.push(`period = $${i}`); values.push(period); i++;
    }
    if (target !== undefined) {
      if (typeof target !== 'number' || target < 0) return res.status(400).json({ error: 'target must be a non-negative number' });
      updates.push(`target = $${i}`); values.push(target); i++;
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const userId = getEffectiveUserId(req);
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(rowToGoal(result.rows[0]));
  } catch (e) {
    console.error('update goal error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update goal' });
  }
}

export async function deleteGoal(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Goal not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete goal error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete goal' });
  }
}
