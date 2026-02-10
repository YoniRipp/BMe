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

export type BalancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodBalance {
  income: number;
  expenses: number;
  balance: number;
}

function calculateBalance(transactions: Transaction[]): PeriodBalance {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function useBalanceByPeriod(transactions: Transaction[]) {
  const [selectedPeriod, setSelectedPeriod] = useState<BalancePeriod>('monthly');
  const now = new Date();

  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
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

  const daily = useMemo(() => calculateBalance(dailyTransactions), [dailyTransactions]);
  const weekly = useMemo(() => calculateBalance(weeklyTransactions), [weeklyTransactions]);
  const monthly = useMemo(() => calculateBalance(monthlyTransactions), [monthlyTransactions]);
  const yearly = useMemo(() => calculateBalance(yearlyTransactions), [yearlyTransactions]);

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
