/**
 * Food search model — foods table lookup (name, calories, protein, carbs, fat).
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

/** Use "uncooked" consistently (not "raw") for display. */
function normalizePreparationName(name, preparation) {
  if (!name || typeof name !== 'string') return name;
  const prep = (preparation || 'cooked').toLowerCase();
  if (prep === 'uncooked') return name.replace(/\braw\b/gi, 'uncooked');
  return name;
}

function rowToResult(row) {
  const name = normalizePreparationName(row.name, row.preparation);
  return {
    name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    referenceGrams: REFERENCE_GRAMS,
    isLiquid: Boolean(row.is_liquid),
    preparation: row.preparation ?? 'cooked',
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
 * preferUncooked: when true, prefer rows with preparation = 'uncooked' (e.g. "uncooked rice").
 */
export async function getNutritionForFoodName(pool, foodName, amount, unit, preferUncooked = false) {
  const name = typeof foodName === 'string' ? foodName.trim() : '';
  if (!name) return null;
  const wantPrep = preferUncooked ? 'uncooked' : 'cooked';
  const result = await pool.query(
    `SELECT id, name, calories, protein, carbs, fat, is_liquid, preparation
     FROM foods
     WHERE lower(name) LIKE $1
     ORDER BY (COALESCE(preparation, 'cooked') = $2) DESC, length(name) ASC
     LIMIT 1`,
    ['%' + name.toLowerCase() + '%', wantPrep]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const grams = unitToGrams(amount, unit);
  const scale = grams / REFERENCE_GRAMS;
  const displayName = normalizePreparationName(row.name, row.preparation);
  return {
    name: displayName,
    calories: Math.round(Number(row.calories) * scale),
    protein: Math.round(Number(row.protein) * scale * 10) / 10,
    carbs: Math.round(Number(row.carbs) * scale * 10) / 10,
    fat: Math.round(Number(row.fat) * scale * 10) / 10,
    isLiquid: Boolean(row.is_liquid),
  };
}

export async function search(q, limit = 10) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, calories, protein, carbs, fat, is_liquid, preparation
     FROM foods
     WHERE lower(name) LIKE $1
     ORDER BY name
     LIMIT $2`,
    ['%' + escapeLike(q.toLowerCase()) + '%', limit]
  );
  return result.rows.map(rowToResult);
}
