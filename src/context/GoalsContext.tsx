import React, { createContext, useCallback, useEffect, useState } from 'react';
import { Goal, GoalType, GoalPeriod } from '@/types/goals';
import { goalsApi } from '@/lib/api';
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

interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
}

interface GoalsContextType {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  refetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoalById: (id: string) => Goal | undefined;
  getGoalProgress: (id: string) => GoalProgress;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

function apiToGoal(a: { id: string; type: string; target: number; period: string; createdAt: string }): Goal {
  return {
    id: a.id,
    type: a.type as GoalType,
    target: a.target,
    period: a.period as GoalPeriod,
    createdAt: new Date(a.createdAt),
  };
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { foodEntries } = useEnergy();

  const refetchGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const list = await goalsApi.list();
      setGoals(list.map(apiToGoal));
    } catch (e) {
      setGoalsError(e instanceof Error ? e.message : 'Failed to load goals');
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchGoals();
  }, [refetchGoals]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoalsError(null);
    goalsApi.add({ type: goal.type, target: goal.target, period: goal.period }).then(created => {
      setGoals(prev => [...prev, apiToGoal(created)]);
    }).catch(e => {
      setGoalsError(e instanceof Error ? e.message : 'Failed to add goal');
    });
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoalsError(null);
    const body: { type?: string; target?: number; period?: string } = {};
    if (updates.type !== undefined) body.type = updates.type;
    if (updates.target !== undefined) body.target = updates.target;
    if (updates.period !== undefined) body.period = updates.period;
    goalsApi.update(id, body).then(updated => {
      setGoals(prev =>
        prev.map(g => g.id === id ? apiToGoal(updated) : g)
      );
    }).catch(e => {
      setGoalsError(e instanceof Error ? e.message : 'Failed to update goal');
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoalsError(null);
    goalsApi.delete(id).then(() => {
      setGoals(prev => prev.filter(g => g.id !== id));
    }).catch(e => {
      setGoalsError(e instanceof Error ? e.message : 'Failed to delete goal');
    });
  }, []);

  const getGoalById = useCallback((id: string) => {
    return goals.find(g => g.id === id);
  }, [goals]);

  const getGoalProgress = useCallback((id: string): GoalProgress => {
    const goal = goals.find(g => g.id === id);
    if (!goal) {
      return { current: 0, target: 0, percentage: 0 };
    }

    const now = new Date();
    let dateRange: { start: Date; end: Date };

    switch (goal.period) {
      case 'weekly':
        dateRange = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case 'monthly':
        dateRange = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'yearly':
        dateRange = { start: startOfYear(now), end: endOfYear(now) };
        break;
    }

    let current = 0;

    switch (goal.type) {
      case 'calories':
        current = foodEntries
          .filter(f => isWithinInterval(new Date(f.date), dateRange))
          .reduce((sum, f) => sum + f.calories, 0);
        break;
      case 'workouts':
        current = workouts
          .filter(w => isWithinInterval(new Date(w.date), dateRange))
          .length;
        break;
      case 'savings':
        const periodTransactions = transactions.filter(t =>
          isWithinInterval(new Date(t.date), dateRange)
        );
        const income = periodTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = periodTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        current = income > 0 ? Math.round((balance / income) * 100) : 0;
        break;
    }

    const percentage = goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;

    return { current, target: goal.target, percentage };
  }, [goals, foodEntries, workouts, transactions]);

  return (
    <GoalsContext.Provider value={{
      goals,
      goalsLoading,
      goalsError,
      refetchGoals,
      addGoal,
      updateGoal,
      deleteGoal,
      getGoalById,
      getGoalProgress,
    }}>
      {children}
    </GoalsContext.Provider>
  );
}
