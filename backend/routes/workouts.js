import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports'];

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

export async function listWorkouts(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    res.json(result.rows.map(rowToWorkout));
  } catch (e) {
    console.error('list workouts error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list workouts' });
  }
}

export async function addWorkout(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { date, title, type, durationMinutes, exercises, notes } = req.body ?? {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!WORKOUT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'type must be one of: ' + WORKOUT_TYPES.join(', ') });
    }
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 1) {
      return res.status(400).json({ error: 'durationMinutes must be a positive number' });
    }
    const ex = Array.isArray(exercises) ? exercises : [];
    const pool = getPool();
    const d = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO workouts (user_id, date, title, type, duration_minutes, exercises, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, d.toISOString().slice(0, 10), title.trim(), type, duration, JSON.stringify(ex), notes ?? null]
    );
    res.status(201).json(rowToWorkout(result.rows[0]));
  } catch (e) {
    console.error('add workout error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add workout' });
  }
}

export async function updateWorkout(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    const { date, title, type, durationMinutes, exercises, notes } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (date !== undefined) { updates.push(`date = $${i}::date`); values.push(date); i++; }
    if (title !== undefined) { updates.push(`title = $${i}`); values.push(typeof title === 'string' ? title.trim() : title); i++; }
    if (type !== undefined) {
      if (!WORKOUT_TYPES.includes(type)) return res.status(400).json({ error: 'type must be one of: ' + WORKOUT_TYPES.join(', ') });
      updates.push(`type = $${i}`); values.push(type); i++;
    }
    if (durationMinutes !== undefined) {
      const duration = Number(durationMinutes);
      if (!Number.isFinite(duration) || duration < 1) return res.status(400).json({ error: 'durationMinutes must be a positive number' });
      updates.push(`duration_minutes = $${i}`); values.push(duration); i++;
    }
    if (exercises !== undefined) { updates.push(`exercises = $${i}::jsonb`); values.push(JSON.stringify(Array.isArray(exercises) ? exercises : [])); i++; }
    if (notes !== undefined) { updates.push(`notes = $${i}`); values.push(notes ?? null); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE workouts SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Workout not found' });
    res.json(rowToWorkout(result.rows[0]));
  } catch (e) {
    console.error('update workout error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update workout' });
  }
}

export async function deleteWorkout(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Workout not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete workout error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete workout' });
  }
}
