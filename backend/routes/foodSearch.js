/**
 * Food search — API Ninjas Nutrition API.
 * One request per search; response includes list of items with full nutrition (calories, protein, carbs, fats).
 * Values normalized to per 100 g where needed.
 *
 * Requires env: API_NINJAS_KEY
 */

const NINJAS_URL = 'https://api.api-ninjas.com/v1/nutrition';
const REFERENCE_GRAMS = 100;

/** Safe numeric value: API may return "Only available for premium subscribers." for calories/protein on free tier. */
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Map one API Ninjas nutrition item to FoodSearchResult. We scale by serving_size_g to per-100g
 * and use API fields: protein_g, carbohydrates_total_g, fat_total_g (no calorie estimation).
 */
function mapItemToResult(item) {
  const name = typeof item.name === 'string' ? item.name.trim() : 'Unknown';
  const servingG = typeof item.serving_size_g === 'number' && item.serving_size_g > 0 ? item.serving_size_g : REFERENCE_GRAMS;
  const scale = REFERENCE_GRAMS / servingG;
  const rawCal = item.calories ?? 0;
  const rawPro = item.protein_g ?? item.protein ?? 0;
  const rawCarbs = item.carbohydrates_total_g ?? 0;
  const rawFats = item.fat_total_g ?? 0;
  const calories = Math.round(safeNum(rawCal) * scale);
  const protein = Math.round((safeNum(rawPro) * scale) * 10) / 10;
  const carbs = Math.round((safeNum(rawCarbs) * scale) * 10) / 10;
  const fats = Math.round((safeNum(rawFats) * scale) * 10) / 10;
  // When API returns non-numeric for calories/protein (free tier), estimate calories from macros so UI is usable.
  const estimatedCal = calories === 0 && (protein > 0 || carbs > 0 || fats > 0) ? Math.round(protein * 4 + carbs * 4 + fats * 9) : calories;
  return {
    name: name || 'Unknown',
    calories: estimatedCal,
    protein,
    carbs,
    fats,
    referenceGrams: REFERENCE_GRAMS,
  };
}

export async function searchFoods(req, res) {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      error: 'Food search is not configured (missing API_NINJAS_KEY)',
      results: [],
    });
  }

  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Math.max(1, parseInt(req.query?.limit, 10) || 10), 25);

  if (!q) {
    return res.json([]);
  }

  try {
    const queryFor100g = `100g ${q}`.trim();
    const query = encodeURIComponent(queryFor100g);
    const response = await fetch(`${NINJAS_URL}?query=${query}`, {
      headers: { 'X-Api-Key': apiKey.trim() },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('API Ninjas nutrition error:', response.status, text);
      return res.status(502).json({
        error: 'Food search service error',
        results: [],
      });
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
    const results = items
      .slice(0, limit)
      .filter((it) => it && (it.name || it.calories != null))
      .map(mapItemToResult);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e2e403c5-3c70-4f1e-adfb-38e8c147c460',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'foodSearch.js:response_sent',message:'Final results sent to frontend',data:{resultsCount:results.length,firstResult:results[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    return res.json(results);
  } catch (e) {
    console.error('Food search error:', e?.message ?? e);
    return res.status(500).json({
      error: e?.message ?? 'Food search failed',
      results: [],
    });
  }
}
