/**
 * Frankfurter API: https://api.frankfurter.dev
 * Free, no API key. Rates updated daily.
 */

const API_BASE = 'https://api.frankfurter.dev/v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

type RatesCache = { date: string; rates: Record<string, number>; fetchedAt: number };
const cache = new Map<string, RatesCache>();

export interface FrankfurterLatest {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function fetchRates(
  base: string,
  symbols: string
): Promise<FrankfurterLatest> {
  const key = `${base}:${symbols}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { base, date: cached.date, rates: cached.rates };
  }
  const url = `${API_BASE}/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rates failed: ${res.status}`);
  }
  const data = (await res.json()) as FrankfurterLatest;
  cache.set(key, { date: data.date, rates: data.rates, fetchedAt: Date.now() });
  return data;
}

/**
 * Convert amount from one currency to another using cached or fetched rate.
 * If from === to, returns amount. Uses Frankfurter: 1 base = rates[to] in target.
 */
export async function convert(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;
  const { rates } = await fetchRates(from, to);
  const rate = rates[to];
  if (rate == null || !Number.isFinite(rate)) return amount;
  return amount * rate;
}

/**
 * Synchronous convert using a pre-fetched rate map: fromCurrency -> rate to display currency.
 * So convertedAmount = amount * rates[fromCurrency]. Use when you have already loaded rates.
 */
export function convertWithRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesFromToDisplay: Record<string, number> | null
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;
  if (!ratesFromToDisplay || ratesFromToDisplay[from] == null) return amount;
  return amount * ratesFromToDisplay[from];
}
