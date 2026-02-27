/**
 * Replace all foods with ~100 popular foods (per 100g nutrition).
 * Run from repo root: node backend/scripts/seedPopularFoods.js
 * Or from backend: node scripts/seedPopularFoods.js
 * Requires DATABASE_URL (e.g. in backend/.env).
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../src/db/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Per 100g: calories, protein, carbs, fat. Optional: is_liquid, preparation (default 'cooked')
const POPULAR_FOODS = [
  { name: 'Chicken breast, cooked', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Chicken thigh, cooked', calories: 209, protein: 26, carbs: 0, fat: 10.9 },
  { name: 'Ground beef, cooked', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: 'Salmon, cooked', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Tuna, canned in water', calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  { name: 'Eggs, whole cooked', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: 'Egg whites', calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Bacon, cooked', calories: 541, protein: 37, carbs: 1.4, fat: 42 },
  { name: 'Turkey breast, cooked', calories: 135, protein: 30, carbs: 0, fat: 0.7 },
  { name: 'Pork chop, cooked', calories: 231, protein: 26, carbs: 0, fat: 14 },
  { name: 'Shrimp, cooked', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { name: 'White rice, cooked', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Brown rice, cooked', calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
  { name: 'Rice, uncooked', calories: 365, protein: 7.1, carbs: 80, fat: 0.7, preparation: 'uncooked' },
  { name: 'Pasta, cooked', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Oatmeal, cooked', calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
  { name: 'Oats, uncooked', calories: 389, protein: 17, carbs: 66, fat: 6.9, preparation: 'uncooked' },
  { name: 'Quinoa, cooked', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Bread, white', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Bread, whole wheat', calories: 247, protein: 10.7, carbs: 41, fat: 3.4 },
  { name: 'Bagel, plain', calories: 257, protein: 10, carbs: 50, fat: 1.5 },
  { name: 'Tortilla, flour', calories: 304, protein: 8.5, carbs: 49.7, fat: 7.4 },
  { name: 'Potato, baked', calories: 93, protein: 2.5, carbs: 21, fat: 0.1 },
  { name: 'Sweet potato, baked', calories: 90, protein: 2, carbs: 21, fat: 0.1 },
  { name: 'French fries', calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  { name: 'Broccoli, cooked', calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  { name: 'Spinach, raw', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Spinach, cooked', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.3 },
  { name: 'Kale, raw', calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5 },
  { name: 'Lettuce, romaine', calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3 },
  { name: 'Carrots, raw', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Carrots, cooked', calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2 },
  { name: 'Tomato, raw', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: 'Bell pepper, raw', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: 'Onion, raw', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: 'Garlic', calories: 149, protein: 6.5, carbs: 33, fat: 0.5 },
  { name: 'Green beans, cooked', calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  { name: 'Peas, cooked', calories: 84, protein: 5.4, carbs: 15, fat: 0.2 },
  { name: 'Corn, cooked', calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: 'Mushrooms, raw', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  { name: 'Peach', calories: 39, protein: 0.9, carbs: 10, fat: 0.3 },
  { name: 'Pear', calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
  { name: 'Grapefruit', calories: 42, protein: 0.8, carbs: 11, fat: 0.1 },
  { name: 'Lemon', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
  { name: 'Raisins', calories: 299, protein: 3.1, carbs: 79, fat: 0.5 },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Peanut butter', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44 },
  { name: 'Milk, whole', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, is_liquid: true },
  { name: 'Milk, skim', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, is_liquid: true },
  { name: 'Milk, 2%', calories: 50, protein: 3.3, carbs: 4.7, fat: 2, is_liquid: true },
  { name: 'Almond milk, unsweetened', calories: 13, protein: 0.4, carbs: 0.6, fat: 1.1, is_liquid: true },
  { name: 'Yogurt, plain whole milk', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: 'Yogurt, Greek plain', calories: 97, protein: 9, carbs: 3.5, fat: 5 },
  { name: 'Cheddar cheese', calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  { name: 'Mozzarella cheese', calories: 280, protein: 28, carbs: 3.1, fat: 17 },
  { name: 'Cottage cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { name: 'Cream cheese', calories: 342, protein: 5.9, carbs: 4.1, fat: 34 },
  { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  { name: 'Olive oil', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Vegetable oil', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Coconut oil', calories: 862, protein: 0, carbs: 0, fat: 100 },
  { name: 'Mayonnaise', calories: 680, protein: 1.1, carbs: 0.6, fat: 75 },
  { name: 'Ketchup', calories: 112, protein: 1.8, carbs: 26, fat: 0.1 },
  { name: 'Mustard', calories: 162, protein: 10, carbs: 5.3, fat: 12 },
  { name: 'Soy sauce', calories: 53, protein: 5.6, carbs: 6, fat: 0, is_liquid: true },
  { name: 'Honey', calories: 304, protein: 0, carbs: 82, fat: 0, is_liquid: true },
  { name: 'Maple syrup', calories: 260, protein: 0, carbs: 67, fat: 0, is_liquid: true },
  { name: 'Sugar, white', calories: 387, protein: 0, carbs: 100, fat: 0 },
  { name: 'Brown sugar', calories: 380, protein: 0, carbs: 98, fat: 0 },
  { name: 'Coffee, black', calories: 2, protein: 0.1, carbs: 0, fat: 0, is_liquid: true },
  { name: 'Tea, brewed', calories: 1, protein: 0, carbs: 0.2, fat: 0, is_liquid: true },
  { name: 'Orange juice', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, is_liquid: true },
  { name: 'Apple juice', calories: 46, protein: 0.1, carbs: 11, fat: 0.1, is_liquid: true },
  { name: 'Cola', calories: 42, protein: 0, carbs: 10.6, fat: 0, is_liquid: true },
  { name: 'Beer', calories: 43, protein: 0.5, carbs: 3.6, fat: 0, is_liquid: true },
  { name: 'Wine, red', calories: 85, protein: 0.1, carbs: 3.7, fat: 0, is_liquid: true },
  { name: 'Water', calories: 0, protein: 0, carbs: 0, fat: 0, is_liquid: true },
  { name: 'Energy drink', calories: 45, protein: 0, carbs: 11, fat: 0, is_liquid: true },
  { name: 'Green smoothie', calories: 45, protein: 1.5, carbs: 9, fat: 0.5, is_liquid: true },
  { name: 'Pizza, cheese slice', calories: 266, protein: 11, carbs: 33, fat: 10 },
  { name: 'Hamburger, fast food', calories: 354, protein: 17, carbs: 29, fat: 20 },
  { name: 'Cheeseburger', calories: 303, protein: 17, carbs: 25, fat: 16 },
  { name: 'Hot dog', calories: 290, protein: 10, carbs: 4.2, fat: 26 },
  { name: 'Chicken nuggets', calories: 296, protein: 15, carbs: 16, fat: 21 },
  { name: 'Grilled cheese sandwich', calories: 358, protein: 14, carbs: 28, fat: 22 },
  { name: 'Caesar salad', calories: 94, protein: 6, carbs: 5, fat: 6 },
  { name: 'Taco, beef', calories: 226, protein: 9, carbs: 20, fat: 12 },
  { name: 'Burrito, bean', calories: 222, protein: 7.5, carbs: 32, fat: 7 },
  { name: 'Sushi roll, salmon', calories: 143, protein: 6.1, carbs: 20, fat: 3.8 },
  { name: 'Soup, chicken noodle', calories: 36, protein: 2.4, carbs: 3.5, fat: 1.7, is_liquid: true },
  { name: 'Tomato soup', calories: 40, protein: 1.1, carbs: 6.6, fat: 1.2, is_liquid: true },
  { name: 'Hummus', calories: 166, protein: 7.9, carbs: 14.3, fat: 9.6 },
  { name: 'Guacamole', calories: 157, protein: 1.9, carbs: 8.5, fat: 14 },
  { name: 'Salsa', calories: 36, protein: 1.5, carbs: 7, fat: 0.2 },
  { name: 'Dark chocolate', calories: 546, protein: 4.9, carbs: 61, fat: 31 },
  { name: 'Milk chocolate', calories: 535, protein: 8, carbs: 59, fat: 30 },
  { name: 'Ice cream, vanilla', calories: 207, protein: 3.5, carbs: 24, fat: 11 },
  { name: 'Cake, chocolate', calories: 389, protein: 5.3, carbs: 50, fat: 19 },
  { name: 'Cookie, chocolate chip', calories: 502, protein: 5.7, carbs: 64, fat: 24 },
  { name: 'Donut, glazed', calories: 421, protein: 5.2, carbs: 51, fat: 22 },
  { name: 'Granola', calories: 471, protein: 10, carbs: 64, fat: 20 },
  { name: 'Cereal, corn flakes', calories: 357, protein: 7.2, carbs: 84, fat: 0.7 },
  { name: 'Cereal, oatmeal', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { name: 'Protein bar', calories: 400, protein: 30, carbs: 35, fat: 15 },
  { name: 'Protein shake', calories: 120, protein: 24, carbs: 3, fat: 1, is_liquid: true },
  { name: 'Tofu, firm', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: 'Black beans, cooked', calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { name: 'Kidney beans, cooked', calories: 127, protein: 8.7, carbs: 22, fat: 0.5 },
  { name: 'Chickpeas, cooked', calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { name: 'Lentils, cooked', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
];

async function run() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE TABLE foods');
    console.log('Truncated foods table.');

    const batchSize = 25;
    for (let i = 0; i < POPULAR_FOODS.length; i += batchSize) {
      const batch = POPULAR_FOODS.slice(i, i + batchSize);
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
          (_, j) =>
            `($${j * 7 + 1}, $${j * 7 + 2}, $${j * 7 + 3}, $${j * 7 + 4}, $${j * 7 + 5}, $${j * 7 + 6}, $${j * 7 + 7})`
        )
        .join(', ');
      await client.query(
        `INSERT INTO foods (name, calories, protein, carbs, fat, is_liquid, preparation) VALUES ${placeholders}`,
        values
      );
      console.log('Inserted', Math.min(i + batchSize, POPULAR_FOODS.length), 'of', POPULAR_FOODS.length);
    }
    console.log('Done. Total foods:', POPULAR_FOODS.length);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
