/**
 * One-time import of USDA FoodData Central Foundation Foods JSON into foods table.
 * Run from repo root: node backend/scripts/importFoundationFoods.js
 * Or from backend: node scripts/importFoundationFoods.js
 * Requires DATABASE_URL (e.g. in backend/.env).
 *
 * Expects JSON shape: { "FoundationFoods": [ { description, foodNutrients, foodClass }, ... ] }
 * Inserts into foods (name, calories, protein, carbs, fat).
 */

import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../src/db/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const NUTRIENT_ENERGY_KCAL = '208';
const NUTRIENT_ENERGY_KJ = '268';
const NUTRIENT_PROTEIN = '203';
const NUTRIENT_CARBS = '205';
const NUTRIENT_FAT = '204';
const KJ_TO_KCAL = 1 / 4.184;
const BATCH_SIZE = 50;

function getNutrientValue(foodNutrients, number) {
  const numStr = String(number);
  const item = foodNutrients.find(
    (n) => n.nutrient && (String(n.nutrient.number) === numStr || n.nutrient.number === number)
  );
  if (!item) return null;
  const v = item.amount ?? item.median;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

const LIQUID_KEYWORDS = ['beverage', 'beverages', 'drink', 'drinks', 'juice', 'juices', 'soda', 'sodas'];

function isLiquidFromObject(obj) {
  const desc = (typeof obj.description === 'string' ? obj.description : '').toLowerCase();
  const foodClass = (typeof obj.foodClass === 'string' ? obj.foodClass : '').toLowerCase();
  const combined = `${desc} ${foodClass}`;
  return LIQUID_KEYWORDS.some((kw) => combined.includes(kw));
}

function parseFoodObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const description = typeof obj.description === 'string' ? obj.description.trim() : '';
  if (!description) return null;
  const foodNutrients = Array.isArray(obj.foodNutrients) ? obj.foodNutrients : [];
  const caloriesKcal = getNutrientValue(foodNutrients, NUTRIENT_ENERGY_KCAL);
  const caloriesKj = getNutrientValue(foodNutrients, NUTRIENT_ENERGY_KJ);
  const calories =
    caloriesKcal != null
      ? Math.round(caloriesKcal)
      : caloriesKj != null
        ? Math.round(caloriesKj * KJ_TO_KCAL)
        : 0;
  const protein = getNutrientValue(foodNutrients, NUTRIENT_PROTEIN) ?? 0;
  const carbs = getNutrientValue(foodNutrients, NUTRIENT_CARBS) ?? 0;
  const fat = getNutrientValue(foodNutrients, NUTRIENT_FAT) ?? 0;
  let caloriesFinal = calories;
  if (caloriesFinal === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    caloriesFinal = Math.round(4 * protein + 4 * carbs + 9 * fat);
  }
  const is_liquid = isLiquidFromObject(obj);
  const descLower = description.toLowerCase();
  const preparation = /\b(uncooked|raw)\b/.test(descLower) ? 'uncooked' : 'cooked';
  return {
    name: description,
    calories: caloriesFinal,
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
    is_liquid,
    preparation,
  };
}

async function run() {
  const jsonPath =
    process.argv[2] || resolve(join(__dirname, '../../FoodData_Central_foundation_food_json_2025-12-18.json'));
  console.log('Using JSON path:', jsonPath);

  const raw = await readFile(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const foods = Array.isArray(data.FoundationFoods) ? data.FoundationFoods : [];
  console.log('Found', foods.length, 'foods in JSON');

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE TABLE foods');
    console.log('Truncated foods.');

    let batch = [];
    let total = 0;

    for (const obj of foods) {
      const row = parseFoodObject(obj);
      if (!row) continue;
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
      const values = batch.flatMap((r) => [
        r.name,
        r.calories,
        r.protein,
        r.carbs,
        r.fat,
        r.is_liquid ?? false,
        r.preparation ?? 'cooked',
      ]);
      const placeholders = batch
        .map(
          (_, i) =>
            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
        )
        .join(', ');
        await client.query(
          `INSERT INTO foods (name, calories, protein, carbs, fat, is_liquid, preparation) VALUES ${placeholders}`,
          values
        );
        total += batch.length;
        console.log('Inserted', total, 'rows');
        batch = [];
      }
    }
    if (batch.length > 0) {
      const values = batch.flatMap((r) => [
        r.name,
        r.calories,
        r.protein,
        r.carbs,
        r.fat,
        r.is_liquid ?? false,
        r.preparation ?? 'cooked',
      ]);
      const placeholders = batch
        .map(
          (_, i) =>
            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
        )
        .join(', ');
      await client.query(
        `INSERT INTO foods (name, calories, protein, carbs, fat, is_liquid, preparation) VALUES ${placeholders}`,
        values
      );
      total += batch.length;
    }
    console.log('Done. Total rows imported:', total);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
