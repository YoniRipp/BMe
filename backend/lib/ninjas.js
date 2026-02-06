/**
 * API Ninjas Nutrition API — get nutrition for an ingredient string.
 * Used by: (1) voice add_food — Gemini parses speech to food/amount/unit, we build
 * ingr (e.g. "300g roasted chicken breast") and get nutrition. (2) Can be used
 * by food search for single-item lookup if needed.
 *
 * Requires env: API_NINJAS_KEY
 */

const NINJAS_URL = 'https://api.api-ninjas.com/v1/nutrition';

/** API may return "Only available for premium subscribers." for calories/protein on free tier. */
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Get nutrition for one ingredient string (e.g. "300g roasted chicken breast").
 * API Ninjas returns a list of items (one per food in the query); we sum
 * calories/protein/carbs/fats and join names.
 * @param {string} ingr - Ingredient with optional amount+unit
 * @returns {Promise<{ name: string, calories: number, protein: number, carbs: number, fats: number }>}
 */
export async function getNutritionForIngredient(ingr) {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Nutrition API not configured (missing API_NINJAS_KEY)');
  }
  const trimmed = typeof ingr === 'string' ? ingr.trim() : '';
  if (!trimmed) {
    throw new Error('Ingredient string is empty');
  }

  const query = encodeURIComponent(trimmed);
  const response = await fetch(`${NINJAS_URL}?query=${query}`, {
    headers: { 'X-Api-Key': apiKey.trim() },
  });
  if (!response.ok) {
    const text = await response.text();
    console.error('API Ninjas nutrition error:', response.status, text);
    throw new Error('Nutrition lookup failed');
  }
  const data = await response.json();
  // API can return: array, { items: [...] }, or a single nutrition object; normalize to array.
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : data && typeof data === 'object' && ('name' in data || 'calories' in data || 'protein_g' in data)
        ? [data]
        : [];
  if (items.length === 0) {
    return {
      name: trimmed,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };
  }
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;
  const names = [];
  // Sum over all items (multi-item parses); use protein_g (protein fallback), carbohydrates_total_g, fat_total_g.
  for (const it of items) {
    calories += safeNum(it.calories ?? 0);
    protein += safeNum(it.protein_g ?? it.protein ?? 0);
    carbs += safeNum(it.carbohydrates_total_g ?? 0);
    fats += safeNum(it.fat_total_g ?? 0);
    if (typeof it.name === 'string' && it.name.trim()) names.push(it.name.trim());
  }
  if (calories === 0 && (protein > 0 || carbs > 0 || fats > 0)) {
    calories = Math.round(protein * 4 + carbs * 4 + fats * 9);
  }
  const name = names.length > 0 ? names.join(', ') : trimmed;
  return {
    name,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fats: Math.round(fats * 10) / 10,
  };
}
