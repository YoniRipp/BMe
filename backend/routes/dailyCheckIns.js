import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

function rowToCheckIn(row) {
  return {
    id: row.id,
    date: row.date,
    sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : undefined,
  };
}

export async function listDailyCheckIns(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM daily_check_ins WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    res.json(result.rows.map(rowToCheckIn));
  } catch (e) {
    console.error('list daily check-ins error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list daily check-ins' });
  }
}

export async function addDailyCheckIn(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { date, sleepHours } = req.body ?? {};
    const pool = getPool();
    const d = date ? new Date(date) : new Date();
    const sleep = sleepHours != null ? Number(sleepHours) : null;
    if (sleep != null && (!Number.isFinite(sleep) || sleep < 0)) {
      return res.status(400).json({ error: 'sleepHours must be a non-negative number' });
    }
    const result = await pool.query(
      `INSERT INTO daily_check_ins (user_id, date, sleep_hours)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, d.toISOString().slice(0, 10), sleep]
    );
    res.status(201).json(rowToCheckIn(result.rows[0]));
  } catch (e) {
    console.error('add daily check-in error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add daily check-in' });
  }
}

export async function updateDailyCheckIn(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    const { date, sleepHours } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (date !== undefined) { updates.push(`date = $${i}::date`); values.push(date); i++; }
    if (sleepHours !== undefined) {
      const sleep = Number(sleepHours);
      if (!Number.isFinite(sleep) || sleep < 0) return res.status(400).json({ error: 'sleepHours must be a non-negative number' });
      updates.push(`sleep_hours = $${i}`); values.push(sleep); i++;
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE daily_check_ins SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Daily check-in not found' });
    res.json(rowToCheckIn(result.rows[0]));
  } catch (e) {
    console.error('update daily check-in error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update daily check-in' });
  }
}

export async function deleteDailyCheckIn(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM daily_check_ins WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Daily check-in not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete daily check-in error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete daily check-in' });
  }
}
