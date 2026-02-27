/**
 * One-time cleanup: remove from `foods` any row that is NOT in the Food Data Central
 * Foundation Foods JSON. Use this to drop Gemini-created or other incomplete entries
 * so the next voice/add will re-lookup (e.g. Diet Coke) and get full nutrition.
 *
 * Run from repo root: node backend/scripts/removeNonFoundationFoods.js
 * Or from backend: node scripts/removeNonFoundationFoods.js
 * Uses same JSON path as import (default: FoodData_Central_foundation_food_json_2025-12-18.json).
 */

import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../src/db/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

async function run() {
  const jsonPath =
    process.argv[2] || resolve(join(__dirname, '../../FoodData_Central_foundation_food_json_2025-12-18.json'));
  console.log('Using JSON path:', jsonPath);

  const raw = await readFile(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const items = Array.isArray(data.FoundationFoods) ? data.FoundationFoods : [];
  const foundationNames = items
    .map((obj) => (obj && typeof obj.description === 'string' ? obj.description.trim() : ''))
    .filter(Boolean);
  const uniqueNames = [...new Set(foundationNames)];
  console.log('Foundation Foods names in JSON:', uniqueNames.length);

  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM foods WHERE name <> ALL($1::text[]) RETURNING id',
    [uniqueNames]
  );
  const deleted = result.rowCount ?? 0;
  console.log('Deleted', deleted, 'rows that were not in the Foundation Foods list.');
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
