/**
 * Food search model — foundation_foods lookup.
 */
import { getPool } from '../db/pool.js';

const REFERENCE_GRAMS = 100;

/** Escape LIKE wildcards (% and _) so they are matched literally. */
function escapeLike(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

function rowToResult(row) {
  return {
    name: row.description,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fats: Number(row.fats),
    referenceGrams: REFERENCE_GRAMS,
  };
}

export function unitToGrams(amount, unit) {
  const u = (unit || 'g').toLowerCase();
  const n = Number(amount);
  const num = Number.isFinite(n) && n > 0 ? n : 100;
  if (u === 'g') return num;
  if (u === 'kg') return num * 1000;
  if (u === 'ml' || u === 'l') return num * (u === 'l' ? 1000 : 1);
  if (['cup', 'tbsp', 'tsp', 'slice', 'piece', 'serving'].includes(u)) return 100 * num;
  return num;
}

/**
 * Look up one food by name and return scaled nutrition.
 */
export async function getNutritionForFoodName(pool, foodName, amount, unit) {
  const name = typeof foodName === 'string' ? foodName.trim() : '';
  if (!name) return null;
  const result = await pool.query(
    `SELECT id, description, calories, protein, carbs, fats
     FROM foundation_foods
     WHERE lower(description) LIKE $1
     ORDER BY length(description) ASC
     LIMIT 1`,
    ['%' + name.toLowerCase() + '%']
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const grams = unitToGrams(amount, unit);
  const scale = grams / REFERENCE_GRAMS;
  return {
    name: row.description,
    calories: Math.round(Number(row.calories) * scale),
    protein: Math.round(Number(row.protein) * scale * 10) / 10,
    carbs: Math.round(Number(row.carbs) * scale * 10) / 10,
    fats: Math.round(Number(row.fats) * scale * 10) / 10,
  };
}

export async function search(q, limit = 10) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, description, calories, protein, carbs, fats
     FROM foundation_foods
     WHERE lower(description) LIKE $1
     ORDER BY description
     LIMIT $2`,
    ['%' + escapeLike(q.toLowerCase()) + '%', limit]
  );
  return result.rows.map(rowToResult);
}
