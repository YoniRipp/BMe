import { useMemo } from 'react';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useEnergy } from '@/hooks/useEnergy';
import type { Goal, GoalType } from '@/types/goals';
import { isWithinInterval } from 'date-fns';
import { getPeriodRange } from '@/lib/dateRanges';

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

function buildGoalCurrentCalcs(deps: {
  foodEntries: { date: Date | string; calories: number }[];
  workouts: { date: Date }[];
  transactions: { date: Date; type: string; amount: number }[];
}) {
  return {
    calories: (_goal: Goal, dateRange: { start: Date; end: Date }) =>
      deps.foodEntries
        .filter((f) => isWithinInterval(new Date(f.date), dateRange))
        .reduce((sum, f) => sum + f.calories, 0),
    workouts: (_goal: Goal, dateRange: { start: Date; end: Date }) =>
      deps.workouts.filter((w) =>
        isWithinInterval(new Date(w.date), dateRange)
      ).length,
    savings: (_goal: Goal, dateRange: { start: Date; end: Date }) => {
      const periodTransactions = deps.transactions.filter((t) =>
        isWithinInterval(new Date(t.date), dateRange)
      );
      const income = periodTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = periodTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expenses;
      return income > 0 ? Math.round((balance / income) * 100) : 0;
    },
  } as Record<GoalType, (goal: Goal, dateRange: { start: Date; end: Date }) => number>;
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
    const dateRange = getPeriodRange(goal.period, now);
    const calcs = buildGoalCurrentCalcs({
      foodEntries,
      workouts,
      transactions,
    });
    const current = calcs[goal.type](goal, dateRange);

    const percentage =
      goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;
    return { current, target: goal.target, percentage };
  }, [goalId, goals, transactions, workouts, foodEntries]);
}
