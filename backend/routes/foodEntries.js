import { getPool } from '../db.js';
import { getEffectiveUserId } from '../middleware/auth.js';

function rowToFoodEntry(row) {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fats: Number(row.fats),
  };
}

export async function listFoodEntries(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM food_entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    res.json(result.rows.map(rowToFoodEntry));
  } catch (e) {
    console.error('list food entries error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to list food entries' });
  }
}

export async function addFoodEntry(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { date, name, calories, protein, carbs, fats } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const cal = Number(calories);
    const prot = Number(protein);
    const c = Number(carbs);
    const f = Number(fats);
    if (!Number.isFinite(cal) || cal < 0 || !Number.isFinite(prot) || prot < 0 ||
        !Number.isFinite(c) || c < 0 || !Number.isFinite(f) || f < 0) {
      return res.status(400).json({ error: 'calories, protein, carbs, fats must be non-negative numbers' });
    }
    const pool = getPool();
    const d = date ? new Date(date) : new Date();
    const result = await pool.query(
      `INSERT INTO food_entries (user_id, date, name, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, d.toISOString().slice(0, 10), name.trim(), cal, prot, c, f]
    );
    res.status(201).json(rowToFoodEntry(result.rows[0]));
  } catch (e) {
    console.error('add food entry error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to add food entry' });
  }
}

export async function updateFoodEntry(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    const { date, name, calories, protein, carbs, fats } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const updates = [];
    const values = [];
    let i = 1;
    if (date !== undefined) { updates.push(`date = $${i}::date`); values.push(date); i++; }
    if (name !== undefined) { updates.push(`name = $${i}`); values.push(typeof name === 'string' ? name.trim() : name); i++; }
    if (calories !== undefined) { const cal = Number(calories); if (!Number.isFinite(cal) || cal < 0) return res.status(400).json({ error: 'calories must be non-negative' }); updates.push(`calories = $${i}`); values.push(cal); i++; }
    if (protein !== undefined) { const p = Number(protein); if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'protein must be non-negative' }); updates.push(`protein = $${i}`); values.push(p); i++; }
    if (carbs !== undefined) { const c = Number(carbs); if (!Number.isFinite(c) || c < 0) return res.status(400).json({ error: 'carbs must be non-negative' }); updates.push(`carbs = $${i}`); values.push(c); i++; }
    if (fats !== undefined) { const f = Number(fats); if (!Number.isFinite(f) || f < 0) return res.status(400).json({ error: 'fats must be non-negative' }); updates.push(`fats = $${i}`); values.push(f); i++; }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id, userId);
    const result = await pool.query(
      `UPDATE food_entries SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Food entry not found' });
    res.json(rowToFoodEntry(result.rows[0]));
  } catch (e) {
    console.error('update food entry error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to update food entry' });
  }
}

export async function deleteFoodEntry(req, res) {
  try {
    const userId = getEffectiveUserId(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const pool = getPool();
    const result = await pool.query('DELETE FROM food_entries WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Food entry not found' });
    res.status(204).send();
  } catch (e) {
    console.error('delete food entry error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to delete food entry' });
  }
}
