import { useState, useEffect, useCallback } from 'react';
import { fetchRates } from '@/lib/exchangeRates';

/**
 * Fetches rates from each of fromCurrencies to displayCurrency and provides
 * convertToDisplay(amount, fromCurrency) for synchronous conversion.
 */
export function useExchangeRates(
  displayCurrency: string,
  fromCurrencies: string[]
) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const display = displayCurrency.toUpperCase();

  useEffect(() => {
    const uniq = Array.from(new Set(fromCurrencies.map((c) => c.toUpperCase())));
    if (uniq.length === 0) {
      setRates({ [display]: 1 });
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const next: Record<string, number> = { [display]: 1 };

    Promise.all(
      uniq.map(async (from) => {
        if (from === display) return;
        try {
          const data = await fetchRates(from, display);
          const rate = data.rates[display];
          if (rate != null && Number.isFinite(rate) && !cancelled) {
            next[from] = rate;
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load rates');
        }
      })
    ).then(() => {
      if (!cancelled) {
        setRates((prev) => ({ ...prev, ...next }));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [display, fromCurrencies.join(',')]);

  const convertToDisplay = useCallback(
    (amount: number, fromCurrency: string): number => {
      const from = fromCurrency?.toUpperCase() ?? 'USD';
      if (from === display) return amount;
      const rate = rates[from];
      if (rate == null || !Number.isFinite(rate)) return amount;
      return amount * rate;
    },
    [display, rates]
  );

  return { convertToDisplay, rates, loading, error };
}
