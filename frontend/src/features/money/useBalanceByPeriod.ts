import { useMemo, useState } from 'react';
import { Transaction } from '@/types/transaction';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from 'date-fns';
import { WEEK_SUNDAY } from '@/lib/dateRanges';

export type BalancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodBalance {
  income: number;
  expenses: number;
  balance: number;
}

function calculateBalance(
  transactions: Transaction[],
  convertToDisplay: (amount: number, currency: string) => number
): PeriodBalance {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + convertToDisplay(t.amount, t.currency ?? 'USD'), 0);
  return { income, expenses, balance: income - expenses };
}

export function useBalanceByPeriod(
  transactions: Transaction[],
  convertToDisplay: (amount: number, currency: string) => number
) {
  const [selectedPeriod, setSelectedPeriod] = useState<BalancePeriod>('monthly');
  const now = new Date();

  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, WEEK_SUNDAY);
  const weekEnd = endOfWeek(now, WEEK_SUNDAY);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const dailyTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })
      ),
    [transactions, dayStart, dayEnd]
  );
  const weeklyTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: weekStart, end: weekEnd })
      ),
    [transactions, weekStart, weekEnd]
  );
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      ),
    [transactions, monthStart, monthEnd]
  );
  const yearlyTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: yearStart, end: yearEnd })
      ),
    [transactions, yearStart, yearEnd]
  );

  const daily = useMemo(() => calculateBalance(dailyTransactions, convertToDisplay), [dailyTransactions, convertToDisplay]);
  const weekly = useMemo(() => calculateBalance(weeklyTransactions, convertToDisplay), [weeklyTransactions, convertToDisplay]);
  const monthly = useMemo(() => calculateBalance(monthlyTransactions, convertToDisplay), [monthlyTransactions, convertToDisplay]);
  const yearly = useMemo(() => calculateBalance(yearlyTransactions, convertToDisplay), [yearlyTransactions, convertToDisplay]);

  const periodToTransactions: Record<BalancePeriod, Transaction[]> = {
    daily: dailyTransactions,
    weekly: weeklyTransactions,
    monthly: monthlyTransactions,
    yearly: yearlyTransactions,
  };
  const selectedPeriodTransactions = useMemo(
    () => periodToTransactions[selectedPeriod] ?? monthlyTransactions,
    [
      selectedPeriod,
      dailyTransactions,
      weeklyTransactions,
      monthlyTransactions,
      yearlyTransactions,
    ]
  );

  const balances = useMemo(
    () => ({ daily, weekly, monthly, yearly }),
    [daily, weekly, monthly, yearly]
  );

  return {
    selectedPeriod,
    setSelectedPeriod,
    selectedPeriodTransactions,
    balances,
  };
}
