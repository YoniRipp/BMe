/**
 * Food entry model — data access only.
 */
import { getPool } from '../db/pool.js';

type QueryParam = string | number | boolean | null | undefined;

function rowToEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fats: Number(row.fats),
    portionAmount: row.portion_amount != null ? Number(row.portion_amount) : undefined,
    portionUnit: row.portion_unit ?? undefined,
    servingType: row.serving_type ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
  };
}

export async function findByUserId(userId: string) {
  const pool = getPool('energy');
  const result = await pool.query(
    'SELECT id, date, name, calories, protein, carbs, fats, portion_amount, portion_unit, serving_type, start_time, end_time FROM food_entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [userId]
  );
  return result.rows.map(rowToEntry);
}

export async function create(params: Record<string, unknown>) {
  const pool = getPool('energy');
  const { userId, date, name, calories, protein, carbs, fats, portionAmount, portionUnit, servingType, startTime, endTime } = params;
  const d = date ? new Date(date as string) : new Date();
  const result = await pool.query(
    `INSERT INTO food_entries (user_id, date, name, calories, protein, carbs, fats, portion_amount, portion_unit, serving_type, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, date, name, calories, protein, carbs, fats, portion_amount, portion_unit, serving_type, start_time, end_time`,
    [userId, d.toISOString().slice(0, 10), (name as string).trim(), calories, protein, carbs, fats, portionAmount ?? null, portionUnit ?? null, servingType ?? null, startTime ?? null, endTime ?? null]
  );
  return rowToEntry(result.rows[0]);
}

export async function update(id: string, userId: string, updates: Record<string, unknown>) {
  const pool = getPool('energy');
  const entries: string[] = [];
  const values: QueryParam[] = [];
  let i = 1;
  if (updates.date !== undefined) { entries.push(`date = $${i}::date`); values.push(updates.date as QueryParam); i++; }
  if (updates.name !== undefined) { entries.push(`name = $${i}`); values.push(typeof updates.name === 'string' ? updates.name.trim() : updates.name as QueryParam); i++; }
  if (updates.calories !== undefined) { entries.push(`calories = $${i}`); values.push(updates.calories as QueryParam); i++; }
  if (updates.protein !== undefined) { entries.push(`protein = $${i}`); values.push(updates.protein as QueryParam); i++; }
  if (updates.carbs !== undefined) { entries.push(`carbs = $${i}`); values.push(updates.carbs as QueryParam); i++; }
  if (updates.fats !== undefined) { entries.push(`fats = $${i}`); values.push(updates.fats as QueryParam); i++; }
  if (updates.portionAmount !== undefined) { entries.push(`portion_amount = $${i}`); values.push(updates.portionAmount as QueryParam); i++; }
  if (updates.portionUnit !== undefined) { entries.push(`portion_unit = $${i}`); values.push(updates.portionUnit as QueryParam); i++; }
  if (updates.servingType !== undefined) { entries.push(`serving_type = $${i}`); values.push(updates.servingType as QueryParam); i++; }
  if (updates.startTime !== undefined) { entries.push(`start_time = $${i}`); values.push(updates.startTime as QueryParam); i++; }
  if (updates.endTime !== undefined) { entries.push(`end_time = $${i}`); values.push(updates.endTime as QueryParam); i++; }
  if (entries.length === 0) return null;
  values.push(id, userId);
  const result = await pool.query(
    `UPDATE food_entries SET ${entries.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, date, name, calories, protein, carbs, fats, portion_amount, portion_unit, serving_type, start_time, end_time`,
    values
  );
  return (result.rowCount ?? 0) > 0 ? rowToEntry(result.rows[0]) : null;
}

export async function deleteById(id: string, userId: string) {
  const pool = getPool('energy');
  const result = await pool.query('DELETE FROM food_entries WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
