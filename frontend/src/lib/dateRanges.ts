import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';

export type PeriodKey = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_GETTERS: Record<
  PeriodKey,
  (ref: Date) => { start: Date; end: Date }
> = {
  daily: (ref) => ({ start: startOfDay(ref), end: endOfDay(ref) }),
  weekly: (ref) => ({ start: startOfWeek(ref), end: endOfWeek(ref) }),
  monthly: (ref) => ({ start: startOfMonth(ref), end: endOfMonth(ref) }),
  yearly: (ref) => ({ start: startOfYear(ref), end: endOfYear(ref) }),
};

export function getPeriodRange(
  period: PeriodKey,
  refDate: Date = new Date()
): { start: Date; end: Date } {
  return PERIOD_GETTERS[period](refDate);
}

export type TrendPeriodKey = 'week' | 'month' | 'year';

export interface TrendPeriodBounds {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

const TREND_PERIOD_GETTERS: Record<
  TrendPeriodKey,
  (ref: Date) => TrendPeriodBounds
> = {
  week: (ref) => ({
    currentStart: startOfWeek(ref),
    currentEnd: endOfWeek(ref),
    previousStart: startOfWeek(subWeeks(ref, 1)),
    previousEnd: endOfWeek(subWeeks(ref, 1)),
  }),
  month: (ref) => ({
    currentStart: startOfMonth(ref),
    currentEnd: endOfMonth(ref),
    previousStart: startOfMonth(subMonths(ref, 1)),
    previousEnd: endOfMonth(subMonths(ref, 1)),
  }),
  year: (ref) => ({
    currentStart: startOfYear(ref),
    currentEnd: endOfYear(ref),
    previousStart: startOfYear(subYears(ref, 1)),
    previousEnd: endOfYear(subYears(ref, 1)),
  }),
};

export function getTrendPeriodBounds(
  period: TrendPeriodKey,
  refDate: Date = new Date()
): TrendPeriodBounds {
  return TREND_PERIOD_GETTERS[period](refDate);
}
