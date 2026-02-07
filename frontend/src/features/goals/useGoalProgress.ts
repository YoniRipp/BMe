import { useMemo } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from 'date-fns';

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

export function useGoalProgress(goalId: string): GoalProgress {
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { foodEntries } = useEnergy();

  return useMemo(() => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) {
      return { current: 0, target: 0, percentage: 0 };
    }

    const now = new Date();
    const dateRange =
      goal.period === 'weekly'
        ? { start: startOfWeek(now), end: endOfWeek(now) }
        : goal.period === 'monthly'
          ? { start: startOfMonth(now), end: endOfMonth(now) }
          : { start: startOfYear(now), end: endOfYear(now) };

    let current = 0;

    switch (goal.type) {
      case 'calories':
        current = foodEntries
          .filter((f) => isWithinInterval(new Date(f.date), dateRange))
          .reduce((sum, f) => sum + f.calories, 0);
        break;
      case 'workouts':
        current = workouts.filter((w) =>
          isWithinInterval(new Date(w.date), dateRange)
        ).length;
        break;
      case 'savings': {
        const periodTransactions = transactions.filter((t) =>
          isWithinInterval(new Date(t.date), dateRange)
        );
        const income = periodTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = periodTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        current = income > 0 ? Math.round((balance / income) * 100) : 0;
        break;
      }
    }

    const percentage =
      goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;
    return { current, target: goal.target, percentage };
  }, [goalId, goals, transactions, workouts, foodEntries]);
}
