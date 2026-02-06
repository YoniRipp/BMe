/**
 * One-time import of USDA FoodData Central Foundation Foods JSON into foundation_foods table.
 * Run from repo root: node backend/scripts/importFoundationFoods.js
 * Or from backend: node scripts/importFoundationFoods.js
 * Requires DATABASE_URL (e.g. in backend/.env).
 */

import dotenv from 'dotenv';
import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
// #region agent log
const __dirnamePre = fileURLToPath(new URL('.', import.meta.url));
const envPath = join(__dirnamePre, '../.env');
fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importFoundationFoods.js:before-db-import',message:'Before db.js import',data:{__dirname:__dirnamePre,envPath,envExists:existsSync(envPath),DATABASE_URL_set:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
// #endregion
import { getPool } from '../src/db/index.js';

const __dirname = __dirnamePre;
// #region agent log
const dotenvResult = dotenv.config({ path: envPath });
fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importFoundationFoods.js:after-dotenv',message:'After dotenv.config',data:{parsedKeys:dotenvResult.parsed?Object.keys(dotenvResult.parsed):[],error:dotenvResult.error?String(dotenvResult.error):null,DATABASE_URL_set:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
// #endregion

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

function parseLine(line) {
  const raw = line.trim();
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
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
    const fats = getNutrientValue(foodNutrients, NUTRIENT_FAT) ?? 0;
    const food_class = typeof obj.foodClass === 'string' ? obj.foodClass.trim() : null;
    return {
      description,
      calories,
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
      food_class: food_class || null,
    };
  } catch {
    return null;
  }
}

async function run() {
  const jsonPath =
    process.argv[2] || resolve(join(__dirname, '../../FoodData_Central_foundation_food_json_2025-12-18.json'));
  console.log('Using JSON path:', jsonPath);
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importFoundationFoods.js:run-before-getPool',message:'Right before getPool()',data:{DATABASE_URL_set:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4'})}).catch(()=>{});
  // #endregion

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE TABLE foundation_foods');
    console.log('Truncated foundation_foods.');

    const stream = createReadStream(jsonPath, { encoding: 'utf8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    let batch = [];
    let total = 0;

    for await (const line of rl) {
      const row = parseLine(line);
      if (!row) continue;
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
        const values = batch.flatMap((r) => [
          r.description,
          r.calories,
          r.protein,
          r.carbs,
          r.fats,
          r.food_class,
        ]);
        const placeholders = batch
          .map(
            (_, i) =>
              `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
          )
          .join(', ');
        await client.query(
          `INSERT INTO foundation_foods (description, calories, protein, carbs, fats, food_class) VALUES ${placeholders}`,
          values
        );
        total += batch.length;
        console.log('Inserted', total, 'rows');
        batch = [];
      }
    }
    if (batch.length > 0) {
      const values = batch.flatMap((r) => [
        r.description,
        r.calories,
        r.protein,
        r.carbs,
        r.fats,
        r.food_class,
      ]);
      const placeholders = batch
        .map(
          (_, i) =>
            `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
        )
        .join(', ');
      await client.query(
        `INSERT INTO foundation_foods (description, calories, protein, carbs, fats, food_class) VALUES ${placeholders}`,
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
